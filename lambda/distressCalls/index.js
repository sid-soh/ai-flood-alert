const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    if (event.httpMethod === 'POST') {
      // Create new distress call
      const { latitude, longitude, message } = JSON.parse(event.body);
      
      const [result] = await connection.execute(
        'INSERT INTO distress_calls (latitude, longitude, user_message) VALUES (?, ?, ?)',
        [latitude, longitude, message || null]
      );
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, callId: result.insertId })
      };
    }
    
    if (event.httpMethod === 'GET') {
      // Get active distress calls
      const [calls] = await connection.execute(
        'SELECT call_id, latitude, longitude, user_message, call_time FROM distress_calls WHERE rescue_status = "PENDING" ORDER BY call_time DESC LIMIT 50'
      );
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ calls: calls || [] })
      };
    }
    
    await connection.end();
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database operation failed' })
    };
  }
};