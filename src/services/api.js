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

  getEvacuationRoute: async (start, end) => {
    const response = await fetch(`${config.API_BASE_URL}/optimize-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end })
    });
    return response.json();
  }
};