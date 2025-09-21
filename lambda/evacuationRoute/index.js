const https = require('https');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { start, end } = JSON.parse(event.body || '{}');
    console.log('Processing route from', start, 'to', end);
    
    // Get OSRM route
    const osrmResult = await getOSRMRoute(start, end);
    
    if (osrmResult) {
      // Enhance with AI analysis
      const aiEnhancedResult = await enhanceWithBedrock(osrmResult, start, end);
      console.log('AI-enhanced route successful');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(aiEnhancedResult)
      };
    }
    
    // Fallback to direct route
    console.log('Using fallback route');
    const fallbackResult = {
      osrmGeometry: {
        type: 'LineString',
        coordinates: [[start[1], start[0]], [end[1], end[0]]]
      },
      routeDistance: calculateDistance(start, end) * 1000,
      routeDuration: 300,
      riskLevel: 'HIGH',
      warnings: ['Direct route - OSRM unavailable, avoid if possible'],
      waypoints: [
        { lat: start[0], lng: start[1] },
        { lat: end[0], lng: end[1] }
      ]
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackResult)
    };
    
  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        riskLevel: "HIGH",
        warnings: ["Service error"]
      })
    };
  }
};

function getOSRMRoute(start, end) {
  return new Promise((resolve) => {
    const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`;
    const path = `/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    
    const options = {
      hostname: 'router.project-osrm.org',
      port: 443,
      path: path,
      method: 'GET',
      timeout: 8000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (result.code === 'Ok' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            resolve({
              osrmGeometry: route.geometry,
              routeDistance: route.distance,
              routeDuration: route.duration,
              riskLevel: 'LOW',
              warnings: ['OSRM route optimized'],
              waypoints: [
                { lat: start[0], lng: start[1] },
                { lat: end[0], lng: end[1] }
              ]
            });
          } else {
            console.log('OSRM returned no routes');
            resolve(null);
          }
        } catch (e) {
          console.error('OSRM parse error:', e);
          resolve(null);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('OSRM request error:', error);
      resolve(null);
    });
    
    req.on('timeout', () => {
      console.error('OSRM timeout');
      req.destroy();
      resolve(null);
    });
    
    req.end();
  });
}

async function enhanceWithBedrock(osrmResult, start, end) {
  console.log('Starting Bedrock AI analysis...');
  
  // Fetch current flood status
  const floodStatus = await getCurrentFloodStatus();
  
  const prompt = `Analyze this evacuation route based on current flood conditions:

ROUTE DETAILS:
- Start: [${start[0]}, ${start[1]}]
- Destination: [${end[0]}, ${end[1]}]
- Distance: ${(osrmResult.routeDistance/1000).toFixed(1)}km
- Duration: ${Math.round(osrmResult.routeDuration/60)} minutes

CURRENT FLOOD STATUS:
${floodStatus}

Route passes through these coordinates: ${osrmResult.osrmGeometry.coordinates.slice(0, 5).map(coord => `[${coord[1]}, ${coord[0]}]`).join(', ')}

Assess the evacuation route risk level (LOW/MEDIUM/HIGH) and suggest precautions to take along this route. Only return the risk level and two precautions to take.`;

  try {
    console.log('Creating Bedrock command with model: amazon.titan-text-express-v1');
    
    const command = new InvokeModelCommand({
      modelId: "amazon.titan-text-express-v1",
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 200,
          temperature: 0.1
        }
      })
    });

    console.log('Sending request to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('Bedrock response received, status:', response.$metadata?.httpStatusCode);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('Bedrock response body:', responseBody);
    
    const aiText = responseBody.results[0].outputText;
    console.log('AI generated text:', aiText);
    
    // Extract risk level from AI response
    const riskLevel = aiText.includes('HIGH') ? 'HIGH' : aiText.includes('MEDIUM') ? 'MEDIUM' : 'LOW';
    console.log('Extracted risk level:', riskLevel);
    
    return {
      ...osrmResult,
      riskLevel,
      warnings: [`AI Analysis: ${aiText.trim()}`]
    };
    
  } catch (error) {
    console.error('Bedrock error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    });
    
    // Return original result with detailed error
    return {
      ...osrmResult,
      riskLevel: 'MEDIUM',
      warnings: [`AI unavailable: ${error.name} - ${error.message}`]
    };
  }
}

async function getCurrentFloodStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'rt7id5217i.execute-api.ap-southeast-5.amazonaws.com',
      port: 443,
      path: '/prod/flood-status',
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const statusText = result.cities?.map(city => 
            `${city.name}: ${city.riskLevel} risk (${city.accuracy}% accuracy)`
          ).join('\n') || 'Flood data unavailable';
          resolve(statusText);
        } catch (e) {
          resolve('Flood status unavailable');
        }
      });
    });
    
    req.on('error', () => {
      resolve('Flood status unavailable');
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve('Flood status unavailable');
    });
    
    req.end();
  });
}

function calculateDistance(start, end) {
  const R = 6371;
  const dLat = (end[0] - start[0]) * Math.PI / 180;
  const dLon = (end[1] - start[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}