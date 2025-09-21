# RapidResponse 🌊

An AI-powered flood monitoring and emergency response system for Sabah, Malaysia. RapidResponse provides real-time flood risk assessment, intelligent evacuation routing, and emergency assistance coordination.

## 🚀 Features

### 🗺️ Interactive Map
- **Real-time flood risk visualization** with color-coded zones
- **GPS location tracking** and manual location selection
- **Dynamic flood risk circles** sized by city importance
- **Custom markers** for evacuation points and distress calls

### 🤖 AI-Powered Analysis
- **Amazon Bedrock integration** for intelligent flood risk assessment
- **Route safety analysis** with specific warnings and precautions
- **Real-time data processing** from meteorological sources
- **Confidence scoring** based on multiple data sources

### 🚨 Emergency Response
- **Smart distress call system** with flood zone validation
- **Evacuation route planning** with AI risk assessment
- **Emergency shelter location** with optimal routing
- **Mobile-optimized alerts** and notifications

### 📊 Live Monitoring
- **Real-time flood status dashboard** for all Sabah cities
- **Live social media feed** with flood-related updates
- **City-specific risk levels** with accuracy percentages
- **Responsive design** for desktop and mobile

## 🛠️ Technology Stack

### Frontend
- **React 18** with modern hooks and state management
- **Leaflet.js** for interactive mapping
- **Responsive CSS** with mobile-first design
- **Custom modal system** for mobile compatibility

### Backend & APIs
- **AWS Lambda** functions for serverless computing
- **Amazon API Gateway** for REST API endpoints
- **Amazon Bedrock** (Titan model) for AI analysis
- **MySQL RDS** for data persistence
- **OSRM** for route optimization

### Infrastructure
- **AWS Cloud** deployment
- **CORS-enabled** API endpoints
- **Real-time data fetching** with error handling
- **Scalable serverless architecture**

## 📱 Pages & Components

### Map Page
- Interactive Leaflet map with flood risk visualization
- Location selection (GPS or manual)
- Emergency actions panel
- AI route analysis display

### Live Monitor
- Real-time city flood status
- Live tweet feed with flood updates
- Search and filter functionality
- Mobile-responsive layout

## 🔧 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/rapidresponse.git
cd rapidresponse

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 API Endpoints

- `GET /flood-status` - Current flood risk data for all cities
- `POST /distress-calls` - Submit emergency assistance requests
- `GET /distress-calls` - Retrieve distress call locations
- `POST /evacuation-route` - Get AI-analyzed evacuation routes
- `GET /tweets` - Fetch flood-related social media updates

## 🎯 Key Features

### Smart Emergency Validation
- Validates user location against real-time flood zones
- Only allows emergency calls from actual flood-prone areas
- Provides distance to nearest flood risk area

### AI Route Analysis
- Analyzes evacuation routes using current flood conditions
- Provides risk level assessment (LOW/MEDIUM/HIGH)
- Offers specific precautions and warnings

### Mobile-First Design
- Custom alert modals for mobile compatibility
- Touch-friendly interface elements
- Responsive grid layouts
- Optimized loading states

### Real-Time Data Integration
- Live flood status from meteorological APIs
- Social media monitoring for flood updates
- Dynamic risk assessment updates
- Automatic data refresh intervals

## 🏗️ Architecture

```
Frontend (React)
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
├── Amazon Bedrock (AI Analysis)
├── MySQL RDS (Data Storage)
├── OSRM (Route Planning)
└── External APIs (Weather/Social)
```

## 🔒 Security & Privacy

- Location data processed securely
- No persistent storage of personal information
- CORS-enabled API access
- Error handling with graceful fallbacks

## 📊 Data Sources

- **Meteorological data** for weather conditions
- **Social media feeds** for real-time updates
- **Government alerts** for official warnings
- **User-generated** distress calls and reports

## 🚀 Deployment

The application is designed for AWS deployment with:
- Static hosting for frontend
- Lambda functions for backend logic
- RDS for database management
- API Gateway for endpoint management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Emergency Use

RapidResponse is designed for emergency flood situations in Sabah, Malaysia. In case of actual emergencies, always contact local emergency services directly.

**Emergency Contacts:**
- Malaysia Emergency: 999
- Flood Hotline: 1-800-88-9999

---

Built with ❤️ for flood safety and emergency response in Sabah, Malaysia.