# Instructions

1. Install dependencies:
```bash
    pip install -r requirements.txt 
```

2. Download and install XAMPP:
   - Download and install from https://www.apachefriends.org/index.html
   - Start ```MySQL```
   - Make sure MySQL is running before you run the python scripts.

## Script Execution Order
1. Database setup phase: 
```bash
    python create_db.py # Creates the 'flood_alert' database
```
```bash
    python setup_db.py # Creates all tables using schema.sql
```

2. Data collection phase:
```bash
    python scrape_x.py # Scrapes tweets and saves to database
```
```bash
    python fetch_weather_forecast.py # Fetch official data and saves to database
```