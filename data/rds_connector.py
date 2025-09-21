import pymysql
import os
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_rds_connection():
    """Connect to AWS RDS MySQL database"""
    try:
        connection = pymysql.connect(
            host=os.environ['RDS_ENDPOINT'],
            user=os.environ['RDS_USERNAME'],
            password=os.environ['RDS_PASSWORD'],
            database='flood_alert',
            port=3306,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=False,
            connect_timeout=30,
            read_timeout=30,
            write_timeout=30
        )
        logger.info("Successfully connected to RDS")
        return connection
    except Exception as e:
        logger.error(f"RDS connection failed: {e}")
        raise

def execute_query(query, params=None):
    """Execute query and return results"""
    connection = get_rds_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                connection.commit()
                return cursor.rowcount
            return cursor.fetchall()
    except Exception as e:
        connection.rollback()
        logger.error(f"Query execution failed: {e}")
        raise
    finally:
        connection.close()

def execute_insert(query, params=None):
    """Execute insert query and return inserted ID"""
    connection = get_rds_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            connection.commit()
            inserted_id = cursor.lastrowid
            logger.info(f"Insert successful, ID: {inserted_id}")
            return inserted_id
    except Exception as e:
        connection.rollback()
        logger.error(f"Insert failed: {e}")
        raise
    finally:
        connection.close()

def test_connection():
    """Test RDS connection"""
    try:
        connection = get_rds_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            logger.info("RDS connection test successful")
            return True
    except Exception as e:
        logger.error(f"RDS connection test failed: {e}")
        return False
    finally:
        if 'connection' in locals():
            connection.close()