import pymysql
import os
from dotenv import load_dotenv

load_dotenv('.env')

def setup_rds_schema():
    """Setup schema on RDS without migration"""
    
    # Check if RDS_ENDPOINT is set
    rds_endpoint = os.getenv('RDS_ENDPOINT')
    if not rds_endpoint:
        print("Error: RDS_ENDPOINT not found in .env file")
        print("Run: python check-rds-status.py to get the endpoint")
        return
    
    try:
        # RDS connection
        rds_conn = pymysql.connect(
            host=rds_endpoint,
            user=os.getenv('RDS_USERNAME'),
            password=os.getenv('RDS_PASSWORD'),
            database='flood_alert',
            charset='utf8mb4'
        )
        
        print(f"Connected to RDS: {rds_endpoint}")
        
        # Setup RDS schema
        with open('data/schema.sql', 'r') as f:
            schema = f.read()
            
        with rds_conn.cursor() as cursor:
            for statement in schema.split(';'):
                if statement.strip():
                    cursor.execute(statement)
            rds_conn.commit()
        
        print("✓ Database schema created successfully!")
        print("✓ RDS is ready for your scraping scripts")
        
        rds_conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    setup_rds_schema()