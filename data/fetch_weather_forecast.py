import requests
from datetime import datetime
import pymysql
from rds_connector import get_rds_connection


class WeatherAPIConnector:
    def __init__(self):
        self.api_url = "https://api.data.gov.my/weather/forecast"
        self.db_connection = None

    def fetch_weather_data(self):
        """Fetch weather forecast data from Malaysian government API"""
        try:
            response = requests.get(self.api_url)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return None

    def process_and_store_data(self, weather_data):
        """Process weather data and store in meteorological_alert table"""
        if not weather_data:
            return
    
        cursor = None
        try:
            self.db_connection = get_rds_connection()
            if not self.db_connection:
                print("Failed to connect to RDS database")
                return
    
            cursor = self.db_connection.cursor()
    
            # Check if weather_data is a list or dict with 'data' key
            if isinstance(weather_data, list):
                forecasts = weather_data
            else:
                forecasts = weather_data.get('data', [])
    
            # Debug: Print the structure of the first forecast
            if forecasts:
                print("Sample forecast structure:", forecasts[0])
    
            sabah_count = 0
            processed_entries = set()  # Track processed location-date combinations
    
            # Process each forecast entry
            for forecast in forecasts:
                # Extract location information
                location_data = forecast.get('location', {})
    
                if isinstance(location_data, dict):
                    location_name = (
                        location_data.get('location_name') or
                        location_data.get('name') or
                        'Unknown'
                    )
                    location_id_api = location_data.get('location_id', '')
                    state = 'SABAH'
                else:
                    location_name = str(location_data) if location_data else 'Unknown'
                    location_id_api = ''
                    state = 'SABAH'
    
                # Filter for Sabah locations
                sabah_keywords = [
                    # Major cities and towns
                    'sabah', 'kota kinabalu', 'sandakan', 'tawau', 'lahad datu',
                    'semporna', 'kudat', 'keningau', 'beaufort', 'ranau',
                    'tuaran', 'kota belud', 'papar', 'penampang', 'putatan',
                    'kota marudu', 'beluran', 'kinabatangan', 'tongod',

                    # Additional districts and towns
                    'sipitang', 'kuala penyu', 'membakut', 'tambunan', 'kota kinabatangan',
                    'telupid', 'pitas', 'kunak', 'kalabakan', 'tenom',

                    # Sub-districts and smaller areas
                    'kundasang', 'kinarut', 'inanam', 'menggatal', 'sepanggar',
                    'likas', 'tanjung aru', 'donggongon', 'moyog', 'kimanis',
                    'kuala abai', 'bongawan', 'lumadan', 'klias', 'pandasan',

                    # Islands and coastal areas
                    'pulau gaya', 'pulau sapi', 'pulau manukan', 'pulau mamutik',
                    'mabul', 'kapalai', 'sibuan', 'mantanani', 'balambangan',

                    # Interior locations
                    'maliau', 'danum valley', 'crocker range', 'kinabalu park',
                    'deramakot', 'ulu segama', 'tabin', 'kulamba',

                    # Alternative spellings and abbreviations
                    'k.k.', 'kk', 'jesselton', 'api-api', 'labuan'  # Labuan is federal territory but often grouped with Sabah
                ]
                is_sabah_location = any(keyword in location_name.lower() for keyword in sabah_keywords)
    
                if not is_sabah_location:
                    continue
    
                # Create a more unique key using location_id from API, location name, and date
                forecast_date = forecast.get('date', '')
                entry_key = f"{location_id_api}_{location_name}_{forecast_date}"
                
                if entry_key in processed_entries:
                    print(f"Skipping duplicate: {location_name} for {forecast_date}")
                    continue
    
                processed_entries.add(entry_key)
                print(f"Processing Sabah location: {location_name}, Date: {forecast_date}")
    
                # Check if this exact forecast already exists in database
                if self.check_existing_db(cursor, location_name, forecast_date):
                    print(f"Forecast already exists in database for {location_name} on {forecast_date}")
                    continue
    
                sabah_count += 1
    
                # Get or create location
                location_id = self.get_or_create_location(cursor, location_name, state)
    
                # Extract alert information
                alert_type = forecast.get('summary_forecast', 'GENERAL_FORECAST')
                severity_level = self.determine_severity(forecast)
                description = self.build_description(forecast)
                issued_at = self.parse_datetime(forecast_date)
    
                # Insert meteorological alert with IGNORE to prevent duplicates
                insert_query = """
                               INSERT IGNORE INTO meteorological_alert
                               (location_id, alert_type, severity_level, description, issued_at,
                                status, source_url, created_at)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                               """
    
                cursor.execute(insert_query, (
                    location_id,
                    alert_type,
                    severity_level,
                    description,
                    issued_at,
                    'ACTIVE',
                    self.api_url,
                    datetime.now()
                ))
    
            self.db_connection.commit()
            print(f"Successfully stored {sabah_count} unique Sabah weather forecasts")
    
        except Exception as e:
            print(f"RDS Database error: {e}")
            if self.db_connection:
                self.db_connection.rollback()
        finally:
            if cursor:
                cursor.close()
            if self.db_connection:
                self.db_connection.close()
    
    @staticmethod
    def check_existing_db(cursor, location_name, forecast_date):
        """Check if forecast already exists in database"""
        try:
            cursor.execute("""
                SELECT COUNT(*) FROM meteorological_alert ma
                JOIN location l ON ma.location_id = l.location_id
                WHERE l.name = %s AND DATE(ma.issued_at) = %s
            """, (location_name, forecast_date))
            
            result = cursor.fetchone()
            if isinstance(result, dict):
                return result['COUNT(*)'] > 0
            return result[0] > 0
        except Exception as e:
            print(f"Error checking existing forecast: {e}")
            return False

    @staticmethod
    def get_or_create_location(cursor, location_name, state='SABAH'):
        """Get existing location or create new one"""
        # Try to find existing location
        cursor.execute("SELECT location_id FROM location WHERE name = %s AND state = %s", (location_name, state))
        result = cursor.fetchone()

        if result:
            if isinstance(result, dict):
                return result['location_id']
            return result[0]

        # Create new location
        cursor.execute("""
                       INSERT INTO location (name, location_type, state, created_at)
                       VALUES (%s, %s, %s, %s)
                       """, (location_name, 'CITY', state, datetime.now()))

        return cursor.lastrowid

    @staticmethod
    def determine_severity(forecast):
        """Determine severity level based on weather conditions"""
        # Use the correct field names from API
        morning = forecast.get('morning_forecast', '').lower()
        afternoon = forecast.get('afternoon_forecast', '').lower()
        night = forecast.get('night_forecast', '').lower()
        summary = forecast.get('summary_forecast', '').lower()

        max_temp = forecast.get('max_temp', 0)

        # Check for high severity conditions (Malay weather terms)
        all_forecasts = f"{morning} {afternoon} {night} {summary}"

        # High severity - dangerous weather
        if any(keyword in all_forecasts for keyword in [
            'hujan lebat', 'ribut', 'banjir', 'ribut petir kuat', 'angin kencang'
        ]):
            return 'HIGH'

        # Medium severity - moderate weather concerns
        elif any(keyword in all_forecasts for keyword in [
            'hujan', 'ribut petir', 'mendung', 'berawan'
        ]) or max_temp > 35:
            return 'MEDIUM'

        # Low severity - normal conditions
        else:
            return 'LOW'

    @staticmethod
    def build_description(forecast):
        """Build description from forecast data"""
        description_parts = []

        # Add summary forecast
        if 'summary_forecast' in forecast:
            description_parts.append(f"Weather: {forecast['summary_forecast']}")

        # Add timing information
        if 'summary_when' in forecast:
            description_parts.append(f"When: {forecast['summary_when']}")

        # Add temperature range
        if 'min_temp' in forecast and 'max_temp' in forecast:
            description_parts.append(f"Temperature: {forecast['min_temp']}°C - {forecast['max_temp']}°C")

        # Add detailed forecasts for different times
        if 'morning_forecast' in forecast and forecast['morning_forecast'] != forecast.get('summary_forecast', ''):
            description_parts.append(f"Morning: {forecast['morning_forecast']}")

        if 'afternoon_forecast' in forecast and forecast['afternoon_forecast'] != forecast.get('summary_forecast', ''):
            description_parts.append(f"Afternoon: {forecast['afternoon_forecast']}")

        if 'night_forecast' in forecast and forecast['night_forecast'] != forecast.get('summary_forecast', ''):
            description_parts.append(f"Night: {forecast['night_forecast']}")

        return "; ".join(description_parts)

    @staticmethod
    def parse_datetime(date_string):
        """Parse datetime string from API"""
        if not date_string:
            return datetime.now()

        try:
            # Handle YYYY-MM-DD format
            if len(date_string) == 10:
                return datetime.strptime(date_string, '%Y-%m-%d')
            else:
                return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
        except:
            return datetime.now()


def main():
    """Main function to fetch and store weather data"""
    weather_connector = WeatherAPIConnector()
    weather_data = weather_connector.fetch_weather_data()
    weather_connector.process_and_store_data(weather_data)


if __name__ == "__main__":
    main()