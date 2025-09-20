import mysql from 'mysql2/promise';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let connection;
  
  try {
    const { latitude, longitude, radius = 10 } = JSON.parse(event.body);

    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    // Query flood alerts within radius (km)
    const [floodAlerts] = await connection.execute(`
      SELECT 
        id,
        location_name,
        latitude,
        longitude,
        severity,
        alert_type,
        description,
        timestamp,
        active,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance_km
      FROM flood_alerts 
      WHERE active = 1 
      HAVING distance_km <= ? 
      ORDER BY distance_km ASC, severity DESC
    `, [latitude, longitude, latitude, radius]);

    // Query evacuation points within radius
    const [evacuationPoints] = await connection.execute(`
      SELECT 
        id,
        name,
        latitude,
        longitude,
        capacity,
        type,
        contact_info,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance_km
      FROM evacuation_points 
      HAVING distance_km <= ? 
      ORDER BY distance_km ASC
      LIMIT 5
    `, [latitude, longitude, latitude, radius * 2]);

    // Calculate risk level
    const riskLevel = calculateRiskLevel(floodAlerts);

    // Log user location for analytics
    await connection.execute(`
      INSERT INTO user_locations (latitude, longitude, timestamp, risk_level) 
      VALUES (?, ?, NOW(), ?)
    `, [latitude, longitude, riskLevel]);

    const response = {
      location: { latitude, longitude },
      riskLevel,
      floodAlerts: floodAlerts.map(alert => ({
        id: alert.id,
        location: alert.location_name,
        severity: alert.severity,
        type: alert.alert_type,
        description: alert.description,
        distance: Math.round(alert.distance_km * 100) / 100,
        timestamp: alert.timestamp
      })),
      evacuationPoints: evacuationPoints.map(point => ({
        id: point.id,
        name: point.name,
        coordinates: [point.latitude, point.longitude],
        capacity: point.capacity,
        type: point.type,
        distance: Math.round(point.distance_km * 100) / 100,
        contact: point.contact_info
      })),
      recommendations: generateRecommendations(riskLevel, floodAlerts.length)
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to analyze flood data',
        message: error.message 
      })
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

function calculateRiskLevel(alerts) {
  if (alerts.length === 0) return 'LOW';
  
  const highSeverityCount = alerts.filter(a => a.severity === 'HIGH').length;
  const mediumSeverityCount = alerts.filter(a => a.severity === 'MEDIUM').length;
  
  if (highSeverityCount > 0) return 'CRITICAL';
  if (mediumSeverityCount > 1) return 'HIGH';
  if (alerts.length > 0) return 'MEDIUM';
  return 'LOW';
}

function generateRecommendations(riskLevel, alertCount) {
  const recommendations = [];
  
  switch (riskLevel) {
    case 'CRITICAL':
      recommendations.push('EVACUATE IMMEDIATELY to nearest safe location');
      recommendations.push('Follow official evacuation routes');
      recommendations.push('Take emergency supplies and important documents');
      break;
    case 'HIGH':
      recommendations.push('Prepare for possible evacuation');
      recommendations.push('Monitor local emergency broadcasts');
      recommendations.push('Avoid low-lying areas and flood-prone roads');
      break;
    case 'MEDIUM':
      recommendations.push('Stay alert and monitor weather conditions');
      recommendations.push('Avoid unnecessary travel in affected areas');
      break;
    default:
      recommendations.push('No immediate flood risk detected');
      recommendations.push('Continue normal activities with weather awareness');
  }
  
  return recommendations;
}