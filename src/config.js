const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://YOUR_API_GATEWAY_ID.execute-api.ap-southeast-5.amazonaws.com/prod'
    : 'http://localhost:3001'
};

export default config;