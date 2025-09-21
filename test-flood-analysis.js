import { handler } from './floodAnalysis-lambda.js';

async function testFloodAnalysis() {
  console.log('🧪 Testing Flood Analysis Lambda Function...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'Sabah Flood Crisis Location',
      latitude: 5.96941,
      longitude: 116.09044
    },
    {
      name: 'Kota Kinabalu City Center',
      latitude: 5.9804,
      longitude: 116.0735
    },
    {
      name: 'Penampang District',
      latitude: 5.9370,
      longitude: 116.1063
    }
  ];

  for (const testCase of testCases) {
    console.log(`📍 Testing: ${testCase.name}`);
    console.log(`   Coordinates: ${testCase.latitude}, ${testCase.longitude}`);
    
    try {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          latitude: testCase.latitude,
          longitude: testCase.longitude
        })
      };

      const result = await handler(event);
      const data = JSON.parse(result.body);
      
      if (data.success) {
        console.log('✅ Analysis successful');
        console.log(`📊 Weather: ${data.weatherData?.temperature?.toFixed(1)}°C, ${data.weatherData?.humidity?.toFixed(1)}% humidity`);
        console.log(`🏔️ Terrain: ${data.terrainData?.elevation?.toFixed(1)}m elevation, ${data.terrainData?.soilType} soil`);
        console.log(`🤖 AI Analysis: ${data.analysis.substring(0, 100)}...`);
        if (data.fallback) {
          console.log('⚠️ Using fallback analysis (AI unavailable)');
        }
      } else {
        console.log('❌ Analysis failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
    
    console.log('─'.repeat(60));
  }
}

// Run tests
testFloodAnalysis().catch(console.error);