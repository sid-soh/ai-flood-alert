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

    // Mock weather and terrain data for the analysis
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

    // Create prompt for Bedrock Titan Text
    const prompt = `Analyze the flood risk for location ${latitude}, ${longitude} based on the following data:

Weather Conditions:
- Temperature: ${weatherData.temperature.toFixed(1)}°C
- Humidity: ${weatherData.humidity.toFixed(1)}%
- Recent Rainfall: ${weatherData.rainfall.toFixed(1)}mm
- Wind Speed: ${weatherData.windSpeed.toFixed(1)} km/h
- Atmospheric Pressure: ${weatherData.pressure.toFixed(1)} hPa

Terrain Information:
- Elevation: ${terrainData.elevation.toFixed(1)}m above sea level
- Soil Type: ${terrainData.soilType}
- Drainage Quality: ${terrainData.drainageQuality}
- Near Water Body: ${terrainData.nearWaterBody ? 'Yes' : 'No'}
- Urbanization Level: ${terrainData.urbanization.toFixed(1)}%

Please provide a comprehensive flood risk analysis including:
1. Overall flood risk level (Low/Medium/High/Critical)
2. Key contributing factors
3. Specific recommendations for residents
4. Emergency preparedness advice

Keep the response concise but informative, suitable for emergency management purposes.`;

    const modelId = "amazon.titan-text-express-v1";
    
    const command = new InvokeModelCommand({
      modelId,
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 500,
          temperature: 0.3,
          topP: 0.9,
        },
      }),
    });

    console.log('🤖 Calling Bedrock Titan Text for flood analysis...');
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const analysis = responseBody.results[0].outputText.trim();

    console.log('✅ AI Analysis completed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        location: { latitude, longitude },
        analysis: analysis,
        weatherData,
        terrainData,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Flood analysis error:', error);
    
    // Fallback analysis if AI fails
    const fallbackAnalysis = `Flood risk assessment for coordinates ${JSON.parse(event.body || '{}').latitude}, ${JSON.parse(event.body || '{}').longitude}:

RISK LEVEL: MODERATE

Based on current conditions:
- Weather patterns indicate moderate precipitation levels
- Terrain characteristics suggest standard drainage capacity
- Urbanization may impact natural water flow

RECOMMENDATIONS:
- Monitor local weather alerts
- Ensure emergency supplies are accessible
- Know evacuation routes in your area
- Stay informed through official channels

This is a preliminary assessment. For detailed local conditions, consult official meteorological services.`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        location: { 
          latitude: JSON.parse(event.body || '{}').latitude, 
          longitude: JSON.parse(event.body || '{}').longitude 
        },
        analysis: fallbackAnalysis,
        fallback: true,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};