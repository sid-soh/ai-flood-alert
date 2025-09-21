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
    
    if (event.path === '/evacuation-points') {
      const { latitude, longitude } = JSON.parse(event.body || '{}');
      
      const [points] = await connection.execute(`
        SELECT *, 
          (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
          sin(radians(latitude)))) AS distance
        FROM evacuation_points 
        ORDER BY distance 
        LIMIT 5
      `, [latitude, longitude, latitude]);
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(points)
      };
    }
    
    if (event.path === '/flood-alerts') {
      const [alerts] = await connection.execute(`
        SELECT * FROM flood_alerts 
        WHERE active = true 
        ORDER BY timestamp DESC 
        LIMIT 10
      `);
      
      await connection.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(alerts)
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
      body: JSON.stringify({ error: 'Database connection failed' })
    };
  }
};