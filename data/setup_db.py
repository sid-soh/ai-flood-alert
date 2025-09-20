import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

def setup_database():
    """Create database tables using the complete schema"""
    db_config = {
        'host': os.environ.get('DB_HOST', 'localhost'),
        'database': os.environ.get('DB_NAME', 'flood_alert'),
        'user': os.environ.get('DB_USER', 'root'),
        'password': os.environ.get('DB_PASSWORD', ''),
        'port': os.environ.get('DB_PORT', '3306')
    }

    try:
        conn = mysql.connector.connect(**db_config)
        cur = conn.cursor()

        # Read and execute the complete schema file
        with open('schema.sql', 'r') as f:
            sql_content = f.read()

            # Split by semicolon and execute each statement
            statements = sql_content.split(';')

            for statement in statements:
                statement = statement.strip()
                if statement:  # Skip empty statements
                    try:
                        cur.execute(statement)
                        print(f"Executed: {statement[:50]}...")
                    except mysql.connector.Error as e:
                        print(f"Error executing statement: {e}")
                        print(f"Statement: {statement[:100]}...")

        conn.commit()
        print("Database setup completed successfully!")

    except Exception as e:
        print(f"Database setup error: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    setup_database()