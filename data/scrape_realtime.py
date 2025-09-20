import os
import re
import time
import json
from urllib.parse import quote_plus
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, WebDriverException
from db_integration import DatabaseIntegration


class XScrapper:
    """Main class for scraping X flood alerts."""

    # Constants
    COOKIE_FILE = os.environ.get('X_COOKIES_JSON', 'x_cookies.json')
    SEARCH_URL_TEMPLATE = 'https://x.com/search?q={q}&src=typed_query&f=live'
    DEFAULT_DOMAIN = '.x.com'
    BASE_URL = 'https://x.com/'

    # Config
    SABAH_LOCATIONS = [
        # --- State ---
        "sabah",

        # --- Major Cities & Towns ---
        "kota kinabalu", "kk", "sandakan", "tawau", "lahad datu",
        "keningau", "kudat", "semporna", "beaufort", "kunak", "tongod",
        "kota marudu", "pitas", "beluran", "kinabatangan", "tuaran",
        "papar", "penampang", "putatan", "ranau", "kota belud",
        "sipitang", "tenom", "tambunan", "nabawan", "sook",
        "pensiangan", "matunggong", "kalabakan", "sugut",

        # --- Key Suburbs / Areas (KK & surrounds) ---
        "inanam", "likas", "luyang", "menggatal", "sepanggar", "telipok",
        "kingfisher", "donggongon", "bundusan", "lok kawi", "moyog",
        "kimanis", "membakut", "weston", "kuala penyu",

        # --- Rivers (flood-prone) ---
        "sungai kinabatangan", "sungai segama", "sungai kalabakan",
        "sungai padas", "sungai papar", "sungai tuaran", "sungai labuk",
        "sungai sugut", "sungai liwagu", "sungai moyog", "sungai pegalan",
        "sungai membakut",
        # often referenced without the word "sungai"
        "kinabatangan", "padas", "labuk", "sugut", "liwagu", "moyog",
        "pegalan",

        # --- Islands & Coastal Villages ---
        "gaya island", "manukan island", "mantanani", "banggi",
        "balambangan", "mabul", "pom pom", "mataking", "tanjung aru",
        "signal hill",

        # --- Kampungs / Common Phrases ---
        "kampung nelayan", "kampung air", "kg nelayan", "kg air",
        # generic Malay terms
        "kampung", "kg", "taman", "tmn", "bandar",
        "jalan", "jln", "lorong", "pekan"
    ]

    def __init__(self, headless=False):
        self.headless = headless
        self.driver = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()

    def cleanup(self):
        """Clean up resources."""
        if self.driver:
            try:
                self.driver.quit()
                print("Browser closed")
            except Exception:
                pass

    def scrape_tweets(self, query='(banjir OR flood) Malaysia', limit=100, must_have_keywords=None):
        """Main scraping method."""
        if must_have_keywords is None:
            must_have_keywords = ['banjir', 'flood']

        print(f'Starting Selenium search for: {query}')
        alerts = []
        seen_ids = set()

        try:
            self.driver = WebDriverManager.init_driver(self.headless)
            print("Chrome driver initialized successfully")

            # Handle authentication
            cookies_loaded = CookieManager.load_cookies(self.driver, self.COOKIE_FILE)
            if not cookies_loaded:
                print("No valid cookies found or cookies expired.")
                if self.headless:
                    print("Cannot login in headless mode.")
                    print("Solutions:")
                    print(" 1. Delete x_cookies.json and run with HEADLESS=0")
                    print(" 2. Or run: set HEADLESS=0 && python x_webscrape.py")
                    return alerts

                print("Opening login page...")
                self.driver.get('https://x.com/login')
                time.sleep(3)

                if not AuthValidator.wait_for_user_login(self.driver):
                    return alerts

                print("Saving fresh cookies...")
                CookieManager.save_cookies(self.driver, self.COOKIE_FILE)

            # Navigate to search
            search_url = self.SEARCH_URL_TEMPLATE.format(q=quote_plus(query))
            print(f"Navigating to search: {search_url}")

            if not AuthValidator.validate_search_access(self.driver, search_url):
                print("Cannot access search results after authentication.")
                print("Trying to continue anyway...")

            # Wait for results
            print("Waiting for search results to load...")
            wait = WebDriverWait(self.driver, 15)
            search_loaded = False

            for selector in ['//article[@role="article"]', '//div[@data-testid="searchTimeline"]',
                             '//div[contains(text(), "No results")]']:
                try:
                    wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                    search_loaded = True
                    print("Search results loaded successfully")
                    break
                except TimeoutException:
                    continue

            if not search_loaded:
                print('Could not detect search results loading.')
                print('Proceeding with scraping attempt...')

            # Scraping loop
            stagnant_scrolls = 0
            max_stagnant = 10
            scroll_pause = 2

            print(f"Starting to collect tweets (target: {limit})...")

            while len(alerts) < limit and stagnant_scrolls < max_stagnant:
                articles = self.driver.find_elements(By.XPATH, '//article[@role="article"]')
                new_in_pass = 0

                for art in articles:
                    if len(alerts) >= limit:
                        break

                    try:
                        # Parse tweet data
                        data = TweetParser.parse_tweet(art)

                        # Skip if no content
                        if not data.get('content', '').strip():
                            continue

                        # Check for must_have_keywords
                        if must_have_keywords and not TweetParser.contains_keywords(data['content'], must_have_keywords):
                            continue

                        # Extract tweet ID for duplicate checking
                        tweet_id = None
                        if data.get('url'):
                            match = re.search(r'/status/(\d+)', data['url'])
                            if match:
                                tweet_id = match.group(1)

                        # Skip duplicates
                        if tweet_id and tweet_id in seen_ids:
                            continue

                        # Add to results
                        alerts.append(data)

                        if tweet_id:
                            seen_ids.add(tweet_id)

                        new_in_pass += 1
                        content_preview = data['content'][:70] + '...' if len(data['content']) > 70 else data['content']
                        print(f'[{len(alerts)}/{limit}] @{data.get("username","unknown")}: {content_preview}')

                    except StaleElementReferenceException:
                        print("Error parsing tweet: stale element reference")
                        continue
                    except Exception as e:
                        print(f"Error parsing tweet: {e}")
                        continue

                # Handle pagination
                if new_in_pass == 0:
                    stagnant_scrolls += 1
                    scroll_pause = min(scroll_pause * 1.2, 5)
                    print(f"No new tweets found. Stagnant scrolls: {stagnant_scrolls}/{max_stagnant}")
                else:
                    stagnant_scrolls = 0
                    scroll_pause = 2

                if len(alerts) < limit and stagnant_scrolls < max_stagnant:
                    self.driver.execute_script('window.scrollTo(0, document.body.scrollHeight);')
                    time.sleep(scroll_pause)

                    if AuthValidator.detect_login_wall(self.driver):
                        print("Login wall appeared during scraping. Session may have expired.")
                        break

            print(f"\nScraping completed! Collected {len(alerts)} tweets.")

            if len(alerts) == 0:
                print("\nTroubleshooting tips:")
                print("  - Try a different search query")
                print("  - Ensure your cookies are fresh")

        except WebDriverException as e:
            print(f'WebDriver error: {e}')
        except Exception as e:
            print(f'Unexpected error: {e}')

        return alerts


class WebDriverManager:
    """Handles WebDriver initialization and configuration."""

    @staticmethod
    def init_driver(headless=False):
        """Initialize Chrome WebDriver with optimized options."""
        try:
            opts = webdriver.ChromeOptions()

            # Basic options
            if headless:
                opts.add_argument('--headless=new')
            opts.add_argument('--window-size=1920,1080')
            opts.add_argument('--disable-gpu')
            opts.add_argument('--no-sandbox')
            opts.add_argument('--disable-dev-shm-usage')
            opts.add_argument('--disable-web-security')
            opts.add_argument('--allow-running-insecure-content')
            opts.add_argument('--lang=en-US,en')

            # Performance optimizations
            opts.add_argument('--disable-features=VizDisplayCompositor')
            opts.add_argument('--disable-extensions')
            opts.add_argument('--disable-plugins')
            opts.add_argument('--disable-images')

            # Anti-detection
            opts.add_argument('--disable-blink-features=AutomationControlled')
            opts.add_argument(
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )

            # Experimental options
            opts.add_experimental_option('excludeSwitches', ['enable-automation'])
            opts.add_experimental_option('useAutomationExtension', False)
            opts.add_experimental_option('detach', True)
            opts.page_load_strategy = 'eager'

            service = Service()
            driver = webdriver.Chrome(service=service, options=opts)

            # Execute anti-detection script
            try:
                driver.execute_cdp_cmd(
                    'Page.addScriptToEvaluateOnNewDocument',
                    {'source': '''
                        Object.defineProperty(navigator, "webdriver", {get: () => undefined});
                        Object.defineProperty(navigator, "plugins", {get: () => [1, 2, 3, 4, 5]});
                        Object.defineProperty(navigator, "languages", {get: () => ["en-US", "en"]});
                        window.chrome = {runtime: {}};
                    '''}
                )
            except Exception:
                pass

            return driver

        except Exception as e:
            print(f"Failed to initialize Chrome driver: {e}")
            raise


class CookieManager:
    """Handles cookie operations for authentication."""

    @staticmethod
    def normalize_cookie(raw, default_domain):
        """Normalize cookie format for Selenium."""
        ck = {
            'name': raw.get('name') or raw.get('Name'),
            'value': raw.get('value') or raw.get('Value'),
            'domain': raw.get('domain') or raw.get('Domain') or default_domain,
            'path': raw.get('path') or raw.get('Path') or '/',
            'secure': raw.get('secure') if raw.get('secure') is not None else raw.get('Secure', False),
            'httpOnly': raw.get('httpOnly') if raw.get('httpOnly') is not None else raw.get('HttpOnly', False),
        }

        # Handle expiry
        for key in ['expiry', 'expirationDate', 'Expires']:
            if key in raw:
                try:
                    ck['expiry'] = int(float(raw[key]))
                    break
                except (ValueError, TypeError):
                    continue

        if 'sameSite' in raw:
            ck['sameSite'] = raw['sameSite']

        return ck

    @staticmethod
    def load_cookies(driver, cookie_path):
        """Load cookies from file."""
        if not os.path.exists(cookie_path):
            print(f"Cookie file {cookie_path} not found")
            return False

        try:
            with open(cookie_path, 'r', encoding='utf-8') as f:
                cookies = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading cookie file: {e}")
            return False

        if not isinstance(cookies, list) or not cookies:
            print(f'Cookie file {cookie_path} is invalid or empty.')
            return False

        driver.get(XScrapper.BASE_URL)
        time.sleep(2)

        total = 0
        for c in cookies:
            ck = CookieManager.normalize_cookie(c, XScrapper.DEFAULT_DOMAIN)
            if not ck.get('name') or not ck.get('value'):
                continue
            try:
                driver.add_cookie(ck)
                total += 1
            except Exception:
                continue

        print(f'Loaded {total} cookies from {cookie_path}')
        driver.refresh()
        time.sleep(3)

        return AuthValidator.validate_cookies(driver)

    @staticmethod
    def save_cookies(driver, cookie_path):
        """Save cookies to file."""
        cookies = driver.get_cookies()
        if not cookies:
            print("No cookies to save")
            return False

        try:
            with open(cookie_path, 'w', encoding='utf-8') as f:
                json.dump(cookies, f, indent=2)
            print(f'Saved {len(cookies)} cookies to {cookie_path}')
            return True
        except IOError as e:
            print(f"Error saving cookies: {e}")
            return False


class AuthValidator:
    """Handles authentication validation."""

    @staticmethod
    def validate_cookies(driver):
        """Validate if cookies provide access to home timeline."""
        try:
            driver.get('https://x.com/home')
            time.sleep(3)

            success_indicators = [
                "//div[@data-testid='primaryColumn']",
                "//div[@data-testid='sidebarColumn']",
                "//nav[@role='navigation']",
                "//div[contains(@class,'css-1dbjc4n r-1awozwy r-18u37iz r-1h0z5md')]"
            ]

            for indicator in success_indicators:
                if driver.find_elements(By.XPATH, indicator):
                    print("Cookies validated successfully - can access home timeline")
                    return True

            login_indicators = [
                "//span[contains(text(), 'Sign in to X')]",
                "//a[contains(@href, '/login')]",
                "//div[contains(text(), 'Log in')]",
                "//input[@name='text' and @autocomplete='username']"
            ]

            for indicator in login_indicators:
                if driver.find_elements(By.XPATH, indicator):
                    print("Cookies appear invalid - login wall detected")
                    return False

            return False

        except Exception as e:
            print(f"Error validating cookies: {e}")
            return False

    @staticmethod
    def validate_search_access(driver, search_url):
        """Validate access to search functionality."""
        try:
            driver.get(search_url)
            time.sleep(3)

            search_indicators = [
                "//div[@data-testid='searchTimeline']",
                "//article[@role='article']",
                "//div[contains(text(), 'No results')]"
            ]

            for indicator in search_indicators:
                if driver.find_elements(By.XPATH, indicator):
                    return True

            login_indicators = [
                "//span[contains(text(), 'Sign in to X')]",
                "//a[contains(@href, '/login')]",
                "//div[contains(text(), 'Log in')]"
            ]

            for indicator in login_indicators:
                if driver.find_elements(By.XPATH, indicator):
                    return False

            return True

        except Exception as e:
            print(f"Error validating search access: {e}")
            return False

    @staticmethod
    def detect_login_wall(driver):
        """Check if login wall is present."""
        try:
            login_indicators = [
                "//a[contains(@href,'/flow/login')]",
                "//a[contains(@href,'/i/flow/login')]",
                "//span[contains(text(), 'Sign in to X')]",
                "//span[contains(text(), 'Log in')]",
                "//div[contains(text(), 'Sign up')]",
                "//input[@name='text' and @autocomplete='username']",
                "//div[contains(text(), 'Join X today')]",
                "//button[contains(text(), 'Sign in with')]",
                "//div[@data-testid='loginButton']"
            ]

            for indicator in login_indicators:
                if driver.find_elements(By.XPATH, indicator):
                    return True

            current_url = driver.current_url.lower()
            if any(path in current_url for path in ['/login', '/flow/login', '/signup']):
                return True

            if "search" in current_url and not driver.find_elements(By.XPATH, '//article[@role="article"]'):
                time.sleep(3)
                if not driver.find_elements(By.XPATH, '//article[@role="article"]'):
                    return True

            return False

        except Exception:
            return False

    @staticmethod
    def wait_for_user_login(driver, timeout=300):
        """Wait for user to complete login manually."""
        print("\n" + "=" * 60)
        print("LOGIN REQUIRED")
        print("=" * 60)
        print("Please log in to X.com in the browser window that opened.")
        print("After successful login, this script will automatically continue.")
        print(f"Timeout: {timeout} seconds")
        print("=" * 60)

        start = time.time()
        last_status_time = 0

        while time.time() - start < timeout:
            current_time = time.time()
            if current_time - last_status_time > 30:
                remaining = int(timeout - (current_time - start))
                print(f"Still waiting for login... {remaining}s remaining")
                last_status_time = current_time

            if not AuthValidator.detect_login_wall(driver):
                print("\n✓ Login detected! Continuing with scraping...")
                return True

            time.sleep(3)

        print("\n✗ Timeout waiting for login.")
        return False


class TweetParser:
    """Handles tweet parsing and data extraction."""

    @staticmethod
    def extract_first_number(text):
        """Extract first number from text, handling K/M/B suffixes."""
        if not text:
            return 0

        clean_text = text.replace('\u202f', '').replace('\u00a0', ' ').replace('\xa0', ' ')
        patterns = [
            r'([\d,]+\.?\d*)[KkMmBb]?',
            r'([\d,]+)',
        ]

        for pattern in patterns:
            m = re.search(pattern, clean_text)
            if m:
                try:
                    num_str = m.group(1).replace(',', '')
                    num = float(num_str)

                    if 'K' in text.upper():
                        num *= 1000
                    elif 'M' in text.upper():
                        num *= 1000000
                    elif 'B' in text.upper():
                        num *= 1000000000

                    return int(num)
                except (ValueError, AttributeError):
                    continue

        return 0

    @staticmethod
    def contains_keywords(text, keywords):
        """Check if text contains any of the specified keywords."""
        if not text:
            return False

        t = re.sub(r'\s+', ' ', text).lower()
        escaped = [re.escape(k.lower()) for k in keywords]
        pattern = re.compile(r'(?<!\w)#?(%s)(?!\w)' % '|'.join(escaped), re.IGNORECASE)

        return bool(pattern.search(t))

    @staticmethod
    def parse_tweet(article):
        """Parse tweet data from article element."""
        data = {
            'content': '',
            'url': '',
            'username': '',
            'date': '',
            'retweets': 0,
            'likes': 0,
            'replies': 0,
            'views': 0
        }

        try:
            # Extract content
            content_parts = []
            spans = article.find_elements(By.XPATH, './/div[@data-testid="tweetText"]//span')
            for s in spans:
                txt = (s.text or '').strip()
                if txt:
                    content_parts.append(txt)

            if not content_parts:
                blocks = article.find_elements(By.XPATH, './/div[@data-testid="tweetText"]')
                for b in blocks:
                    txt = (b.text or '').strip()
                    if txt:
                        content_parts.append(txt)

            if content_parts:
                joined = ' '.join(content_parts)
                data['content'] = re.sub(r'\s+', ' ', joined).strip()

            # Extract URL and username
            selectors = [
                './/time/ancestor::a[contains(@href,"/status/")]',
                './/a[contains(@href,"/status/") and @role="link"]',
                './/a[contains(@href,"/status/")]',
                './/time/parent::a'
            ]

            href = None
            for selector in selectors:
                try:
                    links = article.find_elements(By.XPATH, selector)
                    for link in links:
                        href = link.get_attribute('href')
                        if href and '/status/' in href and href.startswith('https://'):
                            break
                    if href and '/status/' in href:
                        break
                except:
                    continue

            if href:
                data['url'] = href
                url_match = re.search(r'https?://(?:www\.)?x\.com/([^/]+)/status/(\d+)', href)
                if url_match:
                    data['username'] = url_match.group(1)
            else:
                # Fallback URL construction
                try:
                    username_elem = article.find_element(By.XPATH, './/div[@data-testid="User-Name"]//span[contains(@class,"css-1qaijid")]')
                    username = username_elem.text.strip().replace('@', '')
                    if username:
                        timestamp_id = str(int(time.time() * 1000))
                        data['url'] = f"https://x.com/{username}/status/{timestamp_id}"
                        data['username'] = username
                except:
                    pass

            # Extract date
            try:
                time_elem = article.find_element(By.XPATH, './/time')
                data['date'] = time_elem.get_attribute('datetime') or ''
            except:
                pass

            # Extract metrics
            metrics = {
                'replies': './/div[@data-testid="reply"]',
                'retweets': './/div[@data-testid="retweet"]',
                'likes': './/div[@data-testid="like"]',
                'views': './/a[contains(@href, "/analytics")]'
            }

            for metric, selector in metrics.items():
                try:
                    container = article.find_element(By.XPATH, selector)
                    spans = container.find_elements(By.XPATH, './/span')
                    metric_texts = [s.text.strip() for s in spans if s.text.strip()]
                    for text in metric_texts:
                        if any(ch.isdigit() for ch in text):
                            data[metric] = TweetParser.extract_first_number(text)
                            break
                except Exception:
                    continue

        except Exception as e:
            print(f"Error parsing tweet: {e}")

        return data


def main():
    """Main execution function."""
    print('\n' + '=' * 50)
    print('X Flood Alert Scraper (Real-Time)')
    print('=' * 50)

    # Configuration
    query = '(banjir OR flood) Malaysia'
    limit = 10
    headless_env = os.environ.get('HEADLESS', '0').strip().lower()
    headless = headless_env in ('1', 'true', 'yes', 'on')

    print(f"Search query: {query}")
    print(f"Target limit: {limit} tweets")
    print(f"Headless mode: {'ON' if headless else 'OFF'}")
    print(f"Cookie file: {XScrapper.COOKIE_FILE}")
    print('=' * 50)

    start_time = time.time()
    must_have_keywords = ['banjir', 'flood'] + XScrapper.SABAH_LOCATIONS

    # Use context manager for proper cleanup
    try:
        with XScrapper(headless=headless) as scraper:
            alerts = scraper.scrape_tweets(query=query, limit=limit, must_have_keywords=must_have_keywords)

        end_time = time.time()
        print(f"\nTotal runtime: {end_time - start_time:.1f} seconds")

        # Process results
        if alerts:
            print(f"\nFound {len(alerts)} flood-related tweets.")

            # Debug output
            print("\nFirst 3 tweet URLs:")
            for i, alert in enumerate(alerts[:3]):
                print(f"{i+1}. URL: {alert.get('url', 'NO_URL')}")
                print(f"   Content: {alert.get('content', '')[:60]}...")

            # Save to database
            try:
                db = DatabaseIntegration()
                saved_count = db.save_tweets_to_db(alerts)
                print(f"Saved {saved_count} tweets to database.")
            except Exception as e:
                print(f"Error saving to database: {e}")
        else:
            print("No results collected.")
            print("\nNext steps:")
            print("  1. Delete 'x_cookies.json' if it exists")
            print("  2. Run: set HEADLESS=0 && python x_webscrape.py")
            print("  3. Log in manually when browser opens")
            print("  4. Wait for automatic continuation")

    except Exception as e:
        print(f"Fatal error in main: {e}")


if __name__ == '__main__':
    main()