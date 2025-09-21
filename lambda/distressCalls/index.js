const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306
};

exports.handler = async (event) => {
  console.log('Lambda started, event:', JSON.stringify(event));
  console.log('HTTP Method detected:', event.httpMethod);
  console.log('Request context method:', event.requestContext?.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const method = event.httpMethod || event.requestContext?.httpMethod || 'UNKNOWN';
    console.log('Final method to check:', method);
    
    console.log('Attempting database connection with config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connected successfully');
    
    if (method === 'POST') {
      console.log('Processing POST request');
      const { latitude, longitude, message } = JSON.parse(event.body);
      console.log('Parsed data:', { latitude, longitude, message });
      
      const [result] = await connection.execute(
        'INSERT INTO distress_calls (latitude, longitude, user_message) VALUES (?, ?, ?)',
        [latitude, longitude, message || null]
      );
      console.log('Insert result:', result);
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, callId: result.insertId })
      };
    }
    
    if (method === 'GET' || method === 'UNKNOWN') {
      console.log('Processing GET request (method was:', method, ')');
      // First check all records
      const [allCalls] = await connection.execute(
        'SELECT call_id, latitude, longitude, user_message, call_time, rescue_status FROM distress_calls ORDER BY call_time DESC LIMIT 50'
      );
      console.log('All calls in database:', allCalls.length, allCalls);
      
      // Try simple query first
      const [calls] = await connection.execute(
        'SELECT * FROM distress_calls ORDER BY call_time DESC LIMIT 10'
      );
      console.log('Simple query result:', calls.length, calls);
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ calls: calls || [] })
      };
    }
    
    await connection.end();
    console.log('No method matched - returning 404');
    console.log('Available methods: POST, GET');
    console.log('Received method:', method);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        error: 'Endpoint not found',
        receivedMethod: method,
        availableMethods: ['GET', 'POST', 'OPTIONS']
      })
    };
    
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Database operation failed', 
        details: error.message,
        code: error.code 
      })
    };
  }
};