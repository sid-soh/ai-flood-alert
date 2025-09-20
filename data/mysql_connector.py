import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME'),
    'port': int(os.getenv('DB_PORT'))
}


def get_db_connection():
    """Create and return a MySQL database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL database: {e}")
        return None

def close_db_connection(connection):
    """Close database connection"""
    if connection and connection.is_connected():
        connection.close()


def init_db():
    conn = mysql.connector.connect(**DB_CONFIG)
    c = conn.cursor()

    # Drop existing table to recreate with correct structure
    c.execute('DROP TABLE IF EXISTS x_post')

    c.execute('''
        CREATE TABLE x_post (
            x_post_id INT AUTO_INCREMENT PRIMARY KEY,
            source_id INT NOT NULL,
            location_id INT,
            original_id VARCHAR(255) NOT NULL UNIQUE,
            content TEXT NOT NULL,
            post_time DATETIME NOT NULL,
            scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            url VARCHAR(500),
            sentiment_score DECIMAL(3,2),
            credibility_score INT,
            likes_count INT DEFAULT 0,
            retweets_count INT DEFAULT 0,
            replies_count INT DEFAULT 0,
            views_count INT DEFAULT 0,
            CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES source(source_id),
            CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES location(location_id) ON DELETE SET NULL,
            CHECK (credibility_score >= 0 AND credibility_score <= 100)
        )
    ''')

    c.execute('CREATE INDEX IF NOT EXISTS idx_xpost_post_time ON x_post(post_time)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_xpost_location ON x_post(location_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_xpost_original_id ON x_post(original_id)')

    conn.commit()
    c.close()
    conn.close()

def save_to_db(post):
    conn = mysql.connector.connect(**DB_CONFIG)
    c = conn.cursor()
    try:
        c.execute('''
            INSERT IGNORE INTO x_post
            (source_id, location_id, original_id, content, post_time, url, 
             sentiment_score, credibility_score, likes_count, retweets_count, 
             replies_count, views_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            post['source_id'],
            post.get('location_id'),
            post['original_id'],
            post['content'],
            post['post_time'],
            post.get('url'),
            post.get('sentiment_score'),
            post.get('credibility_score'),
            post.get('likes_count', 0),
            post.get('retweets_count', 0),
            post.get('replies_count', 0),
            post.get('views_count', 0)
        ))
        conn.commit()
    finally:
        c.close()
        conn.close()