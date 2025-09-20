import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/optimize-route', (req, res) => {
  console.log('Received optimize-route request:', req.body);
  const { start, end } = req.body || {};
  
  const mockRoute = {
    waypoints: [
      { lat: start[0], lng: start[1] },
      { lat: end[0], lng: end[1] }
    ],
    riskLevel: "LOW",
    warnings: ["Mock route - using direct path"],
    estimatedTime: "15 minutes",
    osrmGeometry: {
      type: "LineString",
      coordinates: [[start[1], start[0]], [end[1], end[0]]]
    },
    routeDistance: 5.2,
    routeDuration: 15
  };
  
  res.json(mockRoute);
});

app.post('/flood-analysis', (req, res) => {
  const { latitude, longitude } = req.body;
  res.json({
    riskLevel: 'MEDIUM',
    evacuationPoints: [
      { name: 'Community Center', lat: latitude + 0.01, lng: longitude + 0.01 }
    ]
  });
});

app.get('/', (req, res) => {
  res.json({ status: 'Mock server running', endpoints: ['/optimize-route', '/flood-analysis'] });
});

app.listen(3001, () => {
  console.log('Mock server running on http://localhost:3001');
});