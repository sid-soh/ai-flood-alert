import mysql.connector
from datetime import datetime
import os
import re

class DatabaseIntegration:
    def __init__(self, db_config=None):
        if db_config is None:
            db_config = {
                'host': os.environ.get('DB_HOST', 'localhost'),
                'database': os.environ.get('DB_NAME', 'flood_alert'),
                'user': os.environ.get('DB_USER', 'root'),
                'password': os.environ.get('DB_PASSWORD', ''),
                'port': os.environ.get('DB_PORT', '3306')
            }
        self.db_config = db_config

    def get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def extract_location_from_content(self, content):
        sabah_locations = [
            'sabah', 'kota kinabalu', 'kk', 'sandakan', 'tawau', 'lahad datu',
            'keningau', 'kudat', 'semporna', 'beaufort', 'kunak', 'tongod',
            'kota marudu', 'pitas', 'beluran', 'kinabatangan', 'tuaran',
            'papar', 'penampang', 'putatan', 'ranau', 'kota belud',
            'sipitang', 'tenom', 'tambunan', 'nabawan'
        ]
        content_lower = content.lower()
        for location in sabah_locations:
            if location in content_lower:
                return location.title()
        return None

    def find_or_create_location(self, content, cursor):
        location_name = self.extract_location_from_content(content)
        if not location_name:
            return None

        try:
            # Insert if not exists
            cursor.execute("INSERT IGNORE INTO location (name) VALUES (%s)", (location_name,))

            # Get the location_id
            cursor.execute("SELECT location_id FROM location WHERE name = %s", (location_name,))
            result = cursor.fetchone()
            return result[0] if result else None
        except Exception as e:
            print(f"Error in find_or_create_location: {e}")
            return None

    def extract_original_id(self, url):
        if not url:
            return None
        match = re.search(r'/status/(\d+)', url)
        return match.group(1) if match else None

    def convert_date_format(self, date_str):
        if not date_str:
            return datetime.now()

        try:
            if 'T' in date_str:
                date_str = date_str.replace('Z', '+00:00')
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                return dt.replace(tzinfo=None)
            else:
                return datetime.now()
        except:
            return datetime.now()

    def save_tweets_to_db(self, tweets):
        if not tweets:
            print("No tweets to save.")
            return 0

        print(f"Attempting to save {len(tweets)} tweets...")
        saved_count = 0
        conn = None
        cursor = None

        try:
            conn = mysql.connector.connect(**self.db_config)
            cursor = conn.cursor(buffered=True)  # Use buffered cursor

            # Ensure source exists
            cursor.execute("INSERT IGNORE INTO source (name, type) VALUES ('X', 'SOCIAL_MEDIA')")
            cursor.execute("SELECT source_id FROM source WHERE name = 'X'")
            source_result = cursor.fetchone()

            if not source_result:
                print("Error: Could not find or create source")
                return 0

            source_id = source_result[0]

            for i, tweet in enumerate(tweets, 1):
                try:
                    original_id = self.extract_original_id(tweet.get('url', ''))

                    if not original_id:
                        print(f"  - Skipping tweet {i}: No valid original_id")
                        continue

                    # Check if tweet already exists
                    cursor.execute("SELECT COUNT(*) FROM x_post WHERE original_id = %s", (original_id,))
                    count_result = cursor.fetchone()

                    if count_result and count_result[0] > 0:
                        print(f"  - Tweet {i} already exists (duplicate)")
                        continue

                    # Find or create location
                    location_id = self.find_or_create_location(tweet.get('content', ''), cursor)

                    # Convert date
                    post_time = self.convert_date_format(tweet.get('date', ''))

                    # Insert tweet
                    insert_query = '''
                        INSERT INTO x_post 
                        (source_id, location_id, original_id, content, post_time, url, 
                         sentiment_score, credibility_score, likes_count, retweets_count, 
                         replies_count, views_count)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    '''

                    cursor.execute(insert_query, (
                        source_id,
                        location_id,
                        original_id,
                        tweet['content'],
                        post_time,
                        tweet.get('url'),
                        None,  # sentiment_score
                        None,  # credibility_score
                        tweet.get('likes', 0),
                        tweet.get('retweets', 0),
                        tweet.get('replies', 0),
                        tweet.get('views', 0)
                    ))

                    print(f"  - Successfully inserted tweet {i} (ID: {original_id})")
                    saved_count += 1

                except mysql.connector.IntegrityError as e:
                    if "Duplicate entry" in str(e):
                        print(f"  - Duplicate entry detected for tweet {i}")
                    else:
                        print(f"  - Integrity error for tweet {i}: {e}")
                    continue
                except Exception as e:
                    print(f"  - Error saving tweet {i}: {e}")
                    continue

            conn.commit()
            print(f"Successfully saved {saved_count} new tweets to database")

        except Exception as e:
            print(f"Database error: {e}")
            if conn:
                conn.rollback()
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

        return saved_count