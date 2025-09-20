import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import mysql from 'mysql2/promise';

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

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
    const { message, userLocation } = JSON.parse(event.body);

    // Get flood context from database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    const floodContext = await getFloodContext(connection, userLocation);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, floodContext);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: aiResponse,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('AI Assistant error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'AI Assistant unavailable',
        response: 'I apologize, but I am currently unable to process your request. Please contact emergency services if this is urgent.'
      })
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

async function getFloodContext(connection, userLocation) {
  if (!userLocation) return null;

  const { latitude, longitude } = userLocation;
  
  // Get nearby flood alerts
  const [floodAlerts] = await connection.execute(`
    SELECT location_name, severity, alert_type, description
    FROM flood_alerts 
    WHERE active = 1 
    AND (6371 * acos(
      cos(radians(?)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(?)) + 
      sin(radians(?)) * sin(radians(latitude))
    )) <= 20
    ORDER BY severity DESC
    LIMIT 5
  `, [latitude, longitude, latitude]);

  // Get nearby evacuation points
  const [evacuationPoints] = await connection.execute(`
    SELECT name, type, capacity
    FROM evacuation_points 
    WHERE (6371 * acos(
      cos(radians(?)) * cos(radians(latitude)) * 
      cos(radians(longitude) - radians(?)) + 
      sin(radians(?)) * sin(radians(latitude))
    )) <= 10
    ORDER BY capacity DESC
    LIMIT 3
  `, [latitude, longitude, latitude]);

  return {
    userLocation: { latitude, longitude },
    floodAlerts,
    evacuationPoints
  };
}

async function generateAIResponse(userMessage, floodContext) {
  const contextInfo = floodContext ? `
Current flood situation near user:
- Location: ${floodContext.userLocation.latitude}, ${floodContext.userLocation.longitude}
- Active flood alerts: ${JSON.stringify(floodContext.floodAlerts)}
- Nearby evacuation points: ${JSON.stringify(floodContext.evacuationPoints)}
` : 'No location context available.';

  const prompt = `
You are an emergency flood response AI assistant. Provide helpful, accurate, and safety-focused advice.

${contextInfo}

User question: "${userMessage}"

Guidelines:
1. Prioritize user safety above all else
2. Provide clear, actionable advice
3. If situation is critical, recommend contacting emergency services
4. Be concise but thorough
5. Use the flood context data to give location-specific advice

Respond in a helpful, calm, and professional tone.
`;

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-text-express-v1",
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 500,
        temperature: 0.1,
        topP: 0.9
      }
    })
  });

  try {
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.results[0].outputText;
  } catch (error) {
    console.error('Bedrock error:', error);
    return 'I apologize, but I am currently experiencing technical difficulties. For immediate emergency assistance, please contact local emergency services at 999.';
  }
}