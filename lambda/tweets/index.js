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
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('DB Config:', { host: dbConfig.host, user: dbConfig.user, database: dbConfig.database });
    const connection = await mysql.createConnection(dbConfig);
    console.log('Database connected successfully');
    
    // Test basic query first
    const [testCount] = await connection.execute('SELECT COUNT(*) as count FROM x_post');
    console.log('Total x_post records:', testCount[0].count);
    
    const [tweets] = await connection.execute(`
      SELECT 
        xp.content,
        xp.post_time,
        xp.likes_count,
        xp.retweets_count,
        l.name as location_name
      FROM x_post xp
      LEFT JOIN location l ON xp.location_id = l.location_id
      WHERE xp.scraped_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND (xp.content LIKE '%flood%' OR xp.content LIKE '%banjir%' OR xp.content LIKE '%sabah%')
      ORDER BY xp.post_time DESC
      LIMIT 20
    `);
    
    console.log('Query returned tweets:', tweets.length);
    await connection.end();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tweets, totalRecords: testCount[0].count })
    };
  } catch (error) {
    console.error('Tweets error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tweets: [] })
    };
  }
};