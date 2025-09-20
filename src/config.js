const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-gateway-url.amazonaws.com/prod'
    : 'http://localhost:3000'
};

export default config;