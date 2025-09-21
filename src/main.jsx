import React from 'react';
import { createRoot } from 'react-dom/client'
import MapComponent from './MapComponent';
import EvacuationInfo from './EvacuationInfo';
import NewsDashboard from './NewsDashboard';

const title = (
  <h1>Live Map</h1>
);

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
      <p>This map shows your location in real-time as well as the closest evacuation point to you.</p>
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
        // Retry after a short delay if function not available
        setTimeout(trySetLocation, 100);
      }
    };
    trySetLocation();
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      <h3>Choose Location</h3>
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
        Use My Location
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
        View Sabah Flood Crisis
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
    return () => window.removeEventListener('evacuationFound', handleEvacuationFound);
  }, []);
  
  const handleCallForHelp = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      // Check if in affected area (hardcoded for testing)
      const affectedAreas = [
        { name: 'Kota Kinabalu City Center', lat: 5.9804, lng: 116.0735, radius: 2000 },
        { name: 'Penampang District', lat: 5.9370, lng: 116.1063, radius: 3000 }
      ];
      
      const isInAffectedArea = affectedAreas.some(area => {
        const distance = calculateDistance(latitude, longitude, area.lat, area.lng);
        return distance <= area.radius;
      });
      
      if (!isInAffectedArea) {
        alert('You are not currently in an affected flood area.');
        return;
      }
      
      const message = prompt('Please describe your situation (optional):');
      if (message === null) return; // User cancelled
      
      try {
        const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/distress-calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, message })
        });
        
        if (response.ok) {
          alert('Help request sent successfully! Emergency services have been notified.');
        } else {
          alert('Failed to send help request. Please try again.');
        }
      } catch (error) {
        console.error('Error sending distress call:', error);
        alert('Failed to send help request. Please try again.');
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
      <button 
        onClick={() => window.showEvacuationRoute && window.showEvacuationRoute()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px',
          marginRight: '10px'
        }}
      >
        Find Evacuation Route
      </button>
      
      <button 
        onClick={handleCallForHelp}
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px',
          marginRight: '10px'
        }}
      >
        Call for Help
      </button>
      
      <button 
        onClick={toggleDistressCalls}
        style={{
          padding: '10px 20px',
          backgroundColor: distressCallsVisible ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '15px'
        }}
      >
        {distressCallsVisible ? 'Hide Distress Calls' : 'Show Distress Calls'}
      </button>
      
      {aiAnalysis && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '15px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>AI Route Analysis</h4>
          <p style={{ margin: 0, color: '#6c757d' }}>{aiAnalysis}</p>
        </div>
      )}
      
      <EvacuationInfo />
    </div>
  );
}

function GetLegend() {
  return (
    <div>
      <h2>Legend</h2>
      <p>Legend content goes here.</p>
    </div>
  );
}

createRoot(document.getElementById('meow')).render(
  /* mycar.show() */
  title
)

createRoot(document.getElementById('map')).render(
  DisplayMap()
)

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
    
    // Create new roots since innerHTML cleared the old ones
    roots.meow = createRoot(document.getElementById('meow'));
    roots.map = createRoot(document.getElementById('map'));
    roots.mapInfo = createRoot(document.getElementById('map-info'));
    
    roots.meow.render(title);
    roots.map.render(DisplayMap());
    roots.mapInfo.render(GetMapInfo());
    
    console.log('Map page rendered');
  }
}

// Initial page load
roots.meow = createRoot(document.getElementById('meow'));
roots.map = createRoot(document.getElementById('map'));
roots.mapInfo = createRoot(document.getElementById('map-info'));

roots.meow.render(title);
roots.map.render(DisplayMap());
roots.mapInfo.render(GetMapInfo());

// Ensure map component is fully loaded before allowing location changes
setTimeout(() => {
  if (roots.mapInfo) {
    roots.mapInfo.render(GetMapInfo());
  }
}, 500);

// Expose function globally for navigation
window.showPage = showPage;