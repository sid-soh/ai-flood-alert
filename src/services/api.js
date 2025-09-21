import config from '../config';

export const floodAnalysisAPI = {
  analyze: async (latitude, longitude) => {
    const response = await fetch(`${config.API_BASE_URL}/flood-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ latitude, longitude })
    });
    return response.json();
  },

  createDistressCall: async (latitude, longitude, message) => {
    const response = await fetch(`${config.API_BASE_URL}/distress-calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude, message })
    });
    return response.json();
  },

  getDistressCalls: async () => {
    const response = await fetch(`${config.API_BASE_URL}/distress-calls`);
    const result = await response.json();
    return result.calls || [];
  },

  getEvacuationRoute: async (start, end) => {
    const response = await fetch(`${config.API_BASE_URL}/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const result = JSON.parse(text);
    
    // Process OSRM geometry for Leaflet
    if (result.osrmGeometry) {
      result.leafletRoute = {
        coordinates: result.osrmGeometry.coordinates,
        type: result.osrmGeometry.type
      };
    }
    
    return result;
  }
};