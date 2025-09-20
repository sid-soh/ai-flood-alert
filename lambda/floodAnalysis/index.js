const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { latitude, longitude } = JSON.parse(event.body);
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Get nearest evacuation points
    const [evacuationPoints] = await connection.execute(`
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
      FROM evacuation_points 
      ORDER BY distance 
      LIMIT 5
    `, [latitude, longitude, latitude]);
    
    // Get active flood alerts in area
    const [floodAlerts] = await connection.execute(`
      SELECT *, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
      FROM flood_alerts 
      WHERE active = true
      ORDER BY distance 
      LIMIT 10
    `, [latitude, longitude, latitude]);
    
    await connection.end();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        evacuationPoints,
        floodAlerts,
        riskLevel: floodAlerts.length > 0 ? floodAlerts[0].severity : 'LOW'
      })
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