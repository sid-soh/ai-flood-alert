import express from 'express';
import cors from 'cors';
import { handler as floodAnalysisHandler } from './floodAnalysis-lambda.js';
import { handler as sabahFloodHandler } from './sabahFloodStatus-lambda.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Flood Analysis endpoint
app.post('/flood-analysis', async (req, res) => {
  try {
    console.log('🔄 Flood analysis request received');
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body)
    };
    
    const result = await floodAnalysisHandler(event);
    const data = JSON.parse(result.body);
    
    res.status(result.statusCode).json(data);
  } catch (error) {
    console.error('❌ Flood analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sabah Flood Status endpoint
app.post('/sabah-flood-status', async (req, res) => {
  try {
    console.log('🔄 Sabah flood status request received');
    const result = await sabahFloodHandler(req.body || {});
    const data = JSON.parse(result.body);
    
    res.status(result.statusCode).json(data);
  } catch (error) {
    console.error('❌ Sabah flood status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: ['/flood-analysis', '/sabah-flood-status']
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Server running on http://localhost:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   POST /flood-analysis - AI flood risk analysis`);
  console.log(`   POST /sabah-flood-status - Sabah flood monitoring`);
  console.log(`   GET  /health - Health check`);
});

export default app;