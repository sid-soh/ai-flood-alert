import React from 'react';
import { createRoot } from 'react-dom/client'
import MapComponent from './MapComponent';
import EvacuationInfo from './EvacuationInfo';
import NewsDashboard from './NewsDashboard';
import LiveFloodDashboard from './LiveFloodDashboard';

// Import black logo to ensure it's included in build
import blackLogo from './assets/bit-bugs-logo-black-2.png';

function TitleWithLegend() {
  const [showLegend, setShowLegend] = React.useState(false);
  
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: '0 15px 0 0' }}>Live Map</h1>
        <button 
          onClick={() => setShowLegend(true)}
          style={{
            padding: '6px 10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            '@media (max-width: 768px)': {
              padding: '4px 8px',
              fontSize: '11px'
            }
          }}
        >
          Legend
        </button>
      </div>
      
      {showLegend && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#000' }}>🗺️ Map Legend</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000' }}>📍 Markers</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', background: '#007bff', borderRadius: '50%', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>Your Location / Selected Location</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', background: '#28a745', borderRadius: '50%', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>🏥 Evacuation Point</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', background: '#dc3545', borderRadius: '50%', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>🚨 Distress Call</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000' }}>🌊 Flood Risk Areas</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', background: 'red', opacity: '0.3', border: '2px solid red', borderRadius: '50%', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>HIGH Risk Zone</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '20px', height: '20px', background: 'yellow', opacity: '0.3', border: '2px solid orange', borderRadius: '50%', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>MEDIUM Risk Zone</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000' }}>🛣️ Routes</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '30px', height: '4px', background: 'blue', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>Safe Evacuation Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                <div style={{ width: '30px', height: '4px', background: 'orange', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>Medium Risk Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '30px', height: '4px', background: 'red', marginRight: '10px' }}></div>
                <span style={{ color: '#000' }}>High Risk Route</span>
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={() => setShowLegend(false)}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const title = <TitleWithLegend />;

function DisplayMap() {
  return (
    <div>
      <MapComponent />
    </div>
  );
}

function GetMapInfo() {
  return (
    <div>
      <LocationSelector />
      <GetEvacuationInfo />
    </div>
  );
}

function LocationSelector() {
  
  const handleLocationChange = (location) => {
    const trySetLocation = () => {
      if (window.setMapLocation) {
        window.setMapLocation(location);
      } else {
        setTimeout(trySetLocation, 100);
      }
    };
    trySetLocation();
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h2>Choose Location</h2>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6c757d' }}>Select your location method to view flood risks and find evacuation routes</p>
      <button 
        onClick={() => handleLocationChange('gps')}
        style={{
          padding: '8px 16px',
          marginRight: '10px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        📍 Use GPS Location
      </button>
      <button 
        onClick={() => handleLocationChange({ lat: 5.96941, lng: 116.09044, name: 'Sabah (Flood Crisis)' })}
        style={{
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🌊 View Sabah Crisis Area
      </button>

    </div>
  );
}

function GetEvacuationInfo() {
  const [aiAnalysis, setAiAnalysis] = React.useState('');

  const [distressCallsVisible, setDistressCallsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const handleEvacuationFound = (event) => {
      const routeInfo = event.detail.routeInfo;
      if (routeInfo && routeInfo.warnings && routeInfo.warnings.length > 0) {
        const aiText = routeInfo.warnings[0];
        if (aiText.includes('AI Analysis:')) {
          setAiAnalysis(aiText.replace('AI Analysis: ', ''));
        } else {
          setAiAnalysis(aiText);
        }
      }
    };
    
    window.addEventListener('evacuationFound', handleEvacuationFound);
    return () => {
      window.removeEventListener('evacuationFound', handleEvacuationFound);
    };
  }, []);
  
  const handleCallForHelp = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      console.log('User location:', latitude, longitude);
      
      const affectedAreas = [
        { name: 'Kota Kinabalu City Center', lat: 5.9804, lng: 116.0735, radius: 2000 },
        { name: 'Penampang District', lat: 5.9370, lng: 116.1063, radius: 3000 }
      ];
      
      const distances = affectedAreas.map(area => {
        const distance = calculateDistance(latitude, longitude, area.lat, area.lng);
        console.log(`Distance to ${area.name}: ${distance}m (limit: ${area.radius}m)`);
        return { ...area, distance };
      });
      
      const isInAffectedArea = distances.some(area => area.distance <= area.radius);
      console.log('Is in affected area:', isInAffectedArea);
      
      if (!isInAffectedArea) {
        alert(`You are not currently in an affected flood area.\nClosest area: ${distances[0].name} (${Math.round(distances[0].distance)}m away)`);
        return;
      }
      
      const message = prompt('Please describe your situation (optional):');
      if (message === null) return;
      
      try {
        console.log('Sending distress call:', { latitude, longitude, message });
        const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/distress-calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, message })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response body:', result);
        
        if (response.ok) {
          alert('Help request sent successfully! Emergency services have been notified.');
        } else {
          alert(`Failed to send help request: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error sending distress call:', error);
        alert('Failed to send help request: ' + error.message);
      }
    }, (error) => {
      alert('Unable to get your location. Please enable location services.');
    });
  };
  
  const toggleDistressCalls = () => {
    setDistressCallsVisible(!distressCallsVisible);
    if (window.toggleDistressCalls) {
      window.toggleDistressCalls(!distressCallsVisible);
    }
  };
  
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  return (
    <div>
      {/* Emergency Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#dc3545' }}>🚨 Emergency Actions</h2>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6c757d' }}>The map will find the closest shelter and AI will assess evacuation route risks</p>
        <button 
          onClick={() => {
            window.showEvacuationRoute && window.showEvacuationRoute();
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🤖 Find Evacuation Route + AI Analysis
        </button>
        
        <button 
          onClick={handleCallForHelp}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Call for Help
        </button>
        

        
        {aiAnalysis && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '15px',
            marginTop: '15px',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>AI Route Analysis</h4>
            <p style={{ margin: 0, color: '#6c757d' }}>{aiAnalysis}</p>
          </div>
        )}
        
        <EvacuationInfo />
      </div>

      {/* Map Display Options */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#28a745' }}>🗺️ Map Display Options</h2>
        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6c757d' }}>Show different information layers on the map</p>
        <button 
          onClick={toggleDistressCalls}
          style={{
            padding: '10px 20px',
            backgroundColor: distressCallsVisible ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {distressCallsVisible ? 'Hide Distress Calls' : 'Show Distress Calls'}
        </button>
        
        <button 
          onClick={() => window.showFloodAnalysis && window.showFloodAnalysis()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Flood Risk Areas
        </button>
      </div>

    </div>
  );
}

createRoot(document.getElementById('meow')).render(title)
createRoot(document.getElementById('map')).render(DisplayMap())

// Page state management
let currentPage = 'map';
let roots = {};

function showPage(page) {
  console.log('Switching to page:', page);
  currentPage = page;
  const content = document.getElementById('content');
  
  if (page === 'news') {
    content.innerHTML = '<div id="news-dashboard"></div>';
    if (!roots.news) {
      roots.news = createRoot(document.getElementById('news-dashboard'));
    }
    roots.news.render(<NewsDashboard />);
  } else if (page === 'live') {
    content.innerHTML = '<div id="live-dashboard"></div>';
    if (!roots.live) {
      roots.live = createRoot(document.getElementById('live-dashboard'));
    }
    roots.live.render(<LiveFloodDashboard />);
  } else {
    content.innerHTML = `
      <div id="meow"></div>
      <div id="err"></div>
      <div id="map-container">
        <div id="map"></div>
        <div id="map-info"></div>
      </div>
      <div id="woof"></div>
    `;
    
    roots.meow = createRoot(document.getElementById('meow'));
    roots.map = createRoot(document.getElementById('map'));
    roots.mapInfo = createRoot(document.getElementById('map-info'));
    
    roots.meow.render(title);
    roots.map.render(DisplayMap());
    roots.mapInfo.render(GetMapInfo());
  }
}

// Initial page load
roots.meow = createRoot(document.getElementById('meow'));
roots.map = createRoot(document.getElementById('map'));
roots.mapInfo = createRoot(document.getElementById('map-info'));

roots.meow.render(title);
roots.map.render(DisplayMap());
roots.mapInfo.render(GetMapInfo());

// Make functions available globally
window.showPage = showPage;

window.performFloodAnalysis = async (lat, lng) => {
  try {
    const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/flood-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lng })
    });
    
    const result = await response.json();
    
    window.dispatchEvent(new CustomEvent('floodAnalysisComplete', {
      detail: { analysis: result.analysis || result.message || 'Analysis completed' }
    }));
    
  } catch (error) {
    console.error('Flood analysis error:', error);
    window.dispatchEvent(new CustomEvent('floodAnalysisComplete', {
      detail: { analysis: 'Unable to perform flood analysis at this time.' }
    }));
  }
};