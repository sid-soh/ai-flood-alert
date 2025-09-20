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
  return (
    <div>
      <button 
        onClick={() => window.showEvacuationRoute && window.showEvacuationRoute()}
        style={{
          
        }}
      >
        Find Evacuation Route
      </button>
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