# lambda/flood_alert_api.py
import json
import os
from rds_connector import get_rds_connection

def lambda_handler(event, context):
    """Main Lambda handler with API key authentication"""

    try:
        # Log the incoming request for debugging
        print(f"Event: {json.dumps(event, default=str)}")

        # Skip API key validation for now

        # Parse request details
        http_method = event.get('httpMethod')
        path = event.get('path', '')

        print(f"Method: {http_method}, Path: {path}")

        # Handle OPTIONS preflight for CORS
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key,Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                'body': ''
            }

        # Route to appropriate handler - default to posts
        if http_method == 'GET':
            return get_tweets_handler(event)
        elif http_method == 'POST':
            return post_tweets_handler(event)
        else:
            return get_tweets_handler(event)  # Default to GET posts

    except Exception as e:
        print(f"Lambda error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }

def get_tweets_handler(event):
    """Handle GET requests for retrieving tweets"""
    try:
        params = event.get('queryStringParameters') or {}
        limit = int(params.get('limit', 50))
        offset = int(params.get('offset', 0))
        location = params.get('location', '')

        tweets = get_tweets_from_rds(limit, offset, location)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(tweets)
        }

    except Exception as e:
        print(f"Error in get_tweets_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def post_tweets_handler(event):
    """Handle POST requests for storing tweets"""
    try:
        print(f"POST handler - Event body: {event.get('body', '')}")

        # Parse request body
        body_str = event.get('body', '{}')
        if isinstance(body_str, str):
            body = json.loads(body_str)
        else:
            body = body_str

        tweets = body.get('tweets', [])

        if not tweets:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No tweets provided'})
            }

        print(f"Processing {len(tweets)} tweets")

        # Save to database
        saved_count = save_tweets_to_rds(tweets)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': f'Successfully saved {saved_count} tweets',
                'saved_count': saved_count
            })
        }

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        print(f"Error in post_tweets_handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)})
        }

def get_tweets_from_rds(limit=50, offset=0, location=''):
    """Retrieve tweets from RDS database"""
    conn = get_rds_connection()

    try:
        with conn.cursor() as cursor:
            base_query = """
            SELECT x_post_id, original_id, content, post_time, url,
                   likes_count, retweets_count, replies_count, views_count
            FROM x_post
            """

            if location:
                base_query += " WHERE LOWER(content) LIKE %s"
                cursor.execute(base_query + " ORDER BY post_time DESC LIMIT %s OFFSET %s",
                             (f'%{location.lower()}%', limit, offset))
            else:
                cursor.execute(base_query + " ORDER BY post_time DESC LIMIT %s OFFSET %s",
                             (limit, offset))

            rows = cursor.fetchall()

            tweets = []
            for row in rows:
                tweets.append({
                    'id': row[0],
                    'original_id': row[1],
                    'content': row[2],
                    'post_time': row[3].isoformat() if row[3] else None,
                    'url': row[4],
                    'likes': row[5],
                    'retweets': row[6],
                    'replies': row[7],
                    'views': row[8]
                })

            return tweets

    finally:
        conn.close()

def save_tweets_to_rds(tweets):
    """Save tweets to RDS database"""
    conn = get_rds_connection()
    saved = 0

    try:
        with conn.cursor() as cursor:
            # Ensure source exists
            cursor.execute("INSERT IGNORE INTO source (name, type) VALUES ('X', 'SOCIAL_MEDIA')")
            cursor.execute("SELECT source_id FROM source WHERE name = 'X'")
            source_result = cursor.fetchone()
            source_id = source_result['source_id'] if source_result else 1

            for tweet in tweets:
                try:
                    # Generate tweet ID from URL or content hash
                    tweet_id = tweet.get('url', '').split('/')[-1] if tweet.get('url') else str(hash(tweet.get('content', '')))

                    cursor.execute("""
                        INSERT IGNORE INTO x_post
                        (source_id, original_id, content, post_time, url, likes_count, retweets_count, replies_count, views_count)
                        VALUES (%s, %s, %s, NOW(), %s, %s, %s, %s, %s)
                    """, (
                        source_id,
                        tweet_id,
                        tweet.get('content', ''),
                        tweet.get('url', ''),
                        tweet.get('likes', 0),
                        tweet.get('retweets', 0),
                        tweet.get('replies', 0),
                        tweet.get('views', 0)
                    ))

                    if cursor.rowcount > 0:
                        saved += 1
                        print(f"Saved tweet: {tweet.get('content', '')[:50]}...")

                except Exception as e:
                    print(f"Error saving individual tweet: {str(e)}")
                    continue

            conn.commit()
            print(f"Transaction committed. Total saved: {saved}")

    except Exception as e:
        print(f"Database error: {str(e)}")
        conn.rollback()
        raise e
    finally:
        conn.close()

    return saved