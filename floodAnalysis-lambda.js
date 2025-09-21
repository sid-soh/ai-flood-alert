import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { latitude, longitude } = JSON.parse(event.body || '{}');
    
    if (!latitude || !longitude) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Latitude and longitude are required' })
      };
    }

    // Mock weather and terrain data
    const weatherData = {
      temperature: 28 + Math.random() * 5,
      humidity: 75 + Math.random() * 20,
      rainfall: Math.random() * 50,
      windSpeed: 5 + Math.random() * 15,
      pressure: 1010 + Math.random() * 20
    };

    const terrainData = {
      elevation: Math.random() * 100,
      soilType: ['clay', 'sandy', 'loamy'][Math.floor(Math.random() * 3)],
      drainageQuality: ['poor', 'moderate', 'good'][Math.floor(Math.random() * 3)],
      nearWaterBody: Math.random() > 0.5,
      urbanization: Math.random() * 100
    };

    const prompt = `Analyze flood risk for ${latitude}, ${longitude}:

Weather: ${weatherData.temperature.toFixed(1)}°C, ${weatherData.humidity.toFixed(1)}% humidity, ${weatherData.rainfall.toFixed(1)}mm rain
Terrain: ${terrainData.elevation.toFixed(1)}m elevation, ${terrainData.soilType} soil, ${terrainData.drainageQuality} drainage

Provide: Risk level, key factors, recommendations. Keep concise.`;

    const command = new InvokeModelCommand({
      modelId: "amazon.titan-text-express-v1",
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 300,
          temperature: 0.3,
          topP: 0.9,
        },
      }),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const analysis = responseBody.results[0].outputText.trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis,
        weatherData,
        terrainData
      })
    };

  } catch (error) {
    console.error('Flood analysis error:', error);
    
    const fallbackAnalysis = `Flood Risk Assessment for ${JSON.parse(event.body || '{}').latitude}, ${JSON.parse(event.body || '{}').longitude}:

RISK LEVEL: MODERATE
- Current weather conditions show standard precipitation
- Terrain suggests moderate drainage capacity
- Monitor local alerts and maintain emergency preparedness`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: fallbackAnalysis,
        fallback: true
      })
    };
  }
};