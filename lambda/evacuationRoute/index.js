import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import fetch from 'node-fetch';

const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
const OSRM_BASE_URL = 'https://router.project-osrm.org';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { start, end } = JSON.parse(event.body);

    // 1. Get route context data
    const routeData = await getRouteContext(start, end);
    
    // 2. Optimize with Bedrock AI
    const optimizedRoute = await optimizeWithBedrock(routeData);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(optimizedRoute)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Route optimization failed',
        details: error.message,
        waypoints: [
          { lat: start?.[0] || 0, lng: start?.[1] || 0 },
          { lat: end?.[0] || 0, lng: end?.[1] || 0 }
        ],
        riskLevel: "HIGH",
        warnings: ["Service temporarily unavailable"]
      })
    };
  }
};

async function optimizeWithBedrock(routeData) {
  const prompt = `
You are an emergency evacuation routing expert. Analyze this data and recommend the SAFEST route:

START: [${routeData.start[0]}, ${routeData.start[1]}]
DESTINATION: [${routeData.end[0]}, ${routeData.end[1]}]
FLOOD ZONES: ${JSON.stringify(routeData.floodZones)}
AVAILABLE ROUTES: ${JSON.stringify(routeData.alternativeRoutes)}

Consider:
1. Avoid flooded areas completely
2. Choose higher elevation roads
3. Minimize travel time while prioritizing safety
4. Account for current weather conditions

Return ONLY valid JSON format:
{
  "waypoints": [
    {"lat": ${routeData.start[0]}, "lng": ${routeData.start[1]}},
    {"lat": ${routeData.end[0]}, "lng": ${routeData.end[1]}}
  ],
  "riskLevel": "LOW",
  "warnings": ["Avoid main road due to flooding"],
  "estimatedTime": "15 minutes",
  "reasoning": "Route avoids flood zones and uses higher elevation roads"
}
`;

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-text-express-v1",
    body: JSON.stringify({
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: 1000,
        temperature: 0.1,
        topP: 0.9
      }
    })
  });

  try {
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Parse AI response with fallback
    let aiResponse;
    try {
      const outputText = responseBody.results[0].outputText.trim();
      // Extract JSON from AI response if wrapped in text
      const jsonMatch = outputText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : outputText;
      aiResponse = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError, 'Raw output:', responseBody.results[0].outputText);
      throw parseError;
    }
    
    // Enhance with OSRM route data if available
    if (routeData.alternativeRoutes && routeData.alternativeRoutes.length > 0) {
      const selectedRoute = routeData.alternativeRoutes.find(r => r.type === 'fastest') || routeData.alternativeRoutes[0];
      aiResponse.osrmGeometry = selectedRoute.osrmData?.geometry;
      aiResponse.routeDistance = selectedRoute.distance;
      aiResponse.routeDuration = selectedRoute.duration;
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error('Bedrock error:', error);
    // Fallback to basic route with OSRM data if available
    const fallbackResponse = {
      waypoints: [
        { lat: routeData.start[0], lng: routeData.start[1] },
        { lat: routeData.end[0], lng: routeData.end[1] }
      ],
      riskLevel: "MEDIUM",
      warnings: ["AI optimization unavailable, using direct route"],
      estimatedTime: "Unknown"
    };
    
    // Add OSRM data to fallback if available
    if (routeData.alternativeRoutes && routeData.alternativeRoutes.length > 0) {
      const selectedRoute = routeData.alternativeRoutes[0];
      fallbackResponse.osrmGeometry = selectedRoute.osrmData?.geometry;
      fallbackResponse.routeDistance = selectedRoute.distance;
      fallbackResponse.routeDuration = selectedRoute.duration;
    }
    
    return fallbackResponse;
  }
}

async function getRouteContext(start, end) {
  try {
    // Get multiple route alternatives from OSRM
    const routes = await getOSRMRoutes(start, end);
    
    return {
      start,
      end,
      floodZones: [
        { area: "Kota Kinabalu City Center", severity: "HIGH", coordinates: [5.9804, 116.0735] },
        { area: "Coastal Road", severity: "MEDIUM", coordinates: [5.9731, 116.0678] },
        { area: "Penampang District", severity: "LOW", coordinates: [5.9370, 116.1063] }
      ],
      alternativeRoutes: routes,
      weather: {
        condition: "Heavy Rain",
        visibility: "Poor",
        roadConditions: "Wet and slippery"
      }
    };
  } catch (error) {
    console.error('Error getting route context:', error);
    // Fallback to basic route data
    return {
      start,
      end,
      floodZones: [],
      alternativeRoutes: [{
        id: "direct",
        waypoints: [start, end],
        distance: calculateDistance(start, end),
        duration: 0,
        type: "direct"
      }],
      weather: { condition: "Unknown" }
    };
  }
}

async function getOSRMRoutes(start, end) {
  const routes = [];
  
  try {
    // Get fastest route
    const fastestRoute = await getOSRMRoute(start, end, 'fastest');
    if (fastestRoute) routes.push(fastestRoute);
    
    // Get alternative route with different approach
    const alternativeRoute = await getOSRMRoute(start, end, 'alternative');
    if (alternativeRoute) routes.push(alternativeRoute);
    
  } catch (error) {
    console.error('OSRM API error:', error);
  }
  
  return routes.length > 0 ? routes : [{
    id: "fallback",
    waypoints: [start, end],
    distance: calculateDistance(start, end),
    duration: 0,
    type: "direct"
  }];
}

async function getOSRMRoute(start, end, type = 'fastest') {
  try {
    const coordinates = `${start[1]},${start[0]};${end[1]},${end[0]}`;
    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=${type === 'alternative' ? 'true' : 'false'}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      
      return {
        id: type,
        waypoints: decodeOSRMGeometry(route.geometry),
        distance: route.distance / 1000, // Convert to km
        duration: route.duration / 60, // Convert to minutes
        type: type,
        osrmData: {
          geometry: route.geometry,
          legs: route.legs
        }
      };
    }
  } catch (error) {
    console.error(`Error getting ${type} route from OSRM:`, error);
  }
  
  return null;
}

function decodeOSRMGeometry(geometry) {
  // Convert GeoJSON coordinates to waypoints format
  if (geometry && geometry.coordinates) {
    return geometry.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
  }
  return [];
}

function calculateDistance(start, end) {
  // Simple distance calculation (in km)
  const R = 6371; // Earth's radius in km
  const dLat = (end[0] - start[0]) * Math.PI / 180;
  const dLon = (end[1] - start[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}