import json
from data.rds_connector import execute_query

def lambda_handler(event, context):
    """Main API handler for flood alert data"""
    
    # Debug: print the event to see what API Gateway sends
    print(f"Event: {json.dumps(event)}")
    
    # Try multiple ways to get the path
    path = event.get('resource') or event.get('path') or event.get('requestContext', {}).get('resourcePath', '')
    method = event.get('httpMethod', 'GET')
    
    # If still no path, assume it's alerts (since that's what we're testing)
    if not path:
        path = '/alerts'
    
    try:
        if 'weather' in path and method == 'GET':
            return get_weather_data(event)
        elif 'posts' in path and method == 'GET':
            return get_social_posts(event)
        else:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Endpoint not found: {path}'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }




def get_weather_data(event):
    """Get weather forecast data"""
    location = event.get('queryStringParameters', {}).get('location')
    
    query = """
        SELECT ma.*, l.name as location_name 
        FROM meteorological_alert ma
        LEFT JOIN location l ON ma.location_id = l.location_id
        WHERE ma.alert_type = 'GENERAL_FORECAST'
    """
    params = []
    
    if location:
        query += " AND l.name LIKE %s"
        params.append(f"%{location}%")
    
    query += " ORDER BY ma.issued_at DESC LIMIT 20"
    
    results = execute_query(query, params)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(results, default=str)
    }

def get_social_posts(event):
    """Get social media posts"""
    location = event.get('queryStringParameters', {}).get('location')
    
    query = """
        SELECT xp.*, l.name as location_name, s.name as source_name
        FROM x_post xp
        LEFT JOIN location l ON xp.location_id = l.location_id
        LEFT JOIN source s ON xp.source_id = s.source_id
        WHERE 1=1
    """
    params = []
    
    if location:
        query += " AND l.name LIKE %s"
        params.append(f"%{location}%")
    
    query += " ORDER BY xp.post_time DESC LIMIT 50"
    
    results = execute_query(query, params)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(results, default=str)
    }