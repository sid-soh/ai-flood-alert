# Script Execution Order

1. Database setup phase: 
```bash
    python create_db.py # Creates the 'flood_alert' database
```
```bash
    python setup_db.py # Creates all tables using schema.sql
```
2. Data collection phase:
```bash
    python realtime_data.py # Scrapes tweets and saves to database
```