import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', ''),
        port=os.environ.get('DB_PORT', '3306')
    )
    cur = conn.cursor()
    cur.execute("CREATE DATABASE IF NOT EXISTS flood_alert")
    print("Database 'flood_alert' created successfully!")
    conn.close()
except Exception as e:
    print(f"Error: {e}")