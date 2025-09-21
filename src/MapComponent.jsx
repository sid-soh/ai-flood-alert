import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerShadow from '/src/assets/user-marker-shadow.png'; 
import EvacuationMarkerShadow from '/src/assets/evacuation-icon-shadow.png';
import DistressMarker from '/src/assets/distress-icon.png'; 
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { getNearestEvacuationPoint } from './utils/GetNearestEvacuationPoint';
import { floodAnalysisAPI } from './services/api';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const evacuationMarkerRef = useRef(null);
  const geoWatchIdRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationMode, setLocationMode] = useState('manual');
  const [distressMarkers, setDistressMarkers] = useState([]);
  const [floodCircles, setFloodCircles] = useState([]);

  // Custom icon for regular marker 
  const markerIcon = L.icon({
    iconUrl: MarkerShadow,
    iconSize: [34, 41], 
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Custom icon for evacuation point
  const evacuationIcon = L.icon({
    iconUrl: EvacuationMarkerShadow,
    iconSize: [34, 41], 
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  // Custom icon for distress calls
  const distressIcon = L.icon({
    iconUrl: DistressMarker,
    iconSize: [34, 41],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  useEffect(() => {
    // Initialize the map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([5.96941, 116.09044], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);

      // Add initial Sabah marker
      markerRef.current = L.marker([5.96941, 116.09044], { icon: markerIcon }).addTo(mapInstanceRef.current).bindPopup('Sabah (Flood Crisis)');
      setUserLocation({ lat: 5.96941, lng: 116.09044 });
    }

    const setMapLocation = (location) => {
      if (location === 'gps') {
        setLocationMode('gps');
        startGPSTracking();
      } else {
        setLocationMode('manual');
        if (geoWatchIdRef.current) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
        updateMapLocation(location.lat, location.lng, location.name);
      }
    };

    const updateMapLocation = (lat, lng, name = 'Selected Location') => {
      const map = mapInstanceRef.current;
      
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        if (circleRef.current) map.removeLayer(circleRef.current);
      }

      markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(name);
      setUserLocation({ lat, lng });
      map.setView([lat, lng], 13);
    };

    const startGPSTracking = () => {
      const success = (pos) => {
        updateMapLocation(pos.coords.latitude, pos.coords.longitude, 'Your Location');
        
        if (circleRef.current) {
          mapInstanceRef.current.removeLayer(circleRef.current);
        }
        circleRef.current = L.circle([pos.coords.latitude, pos.coords.longitude], { 
          radius: pos.coords.accuracy 
        }).addTo(mapInstanceRef.current);
      };

      const error = (err) => {
        if (err.code === 1) {
          alert('Please allow geolocation access.');
        }
      };

      if (navigator.geolocation) {
        geoWatchIdRef.current = navigator.geolocation.watchPosition(success, error);
      }
    };

    window.setMapLocation = setMapLocation;

    if (locationMode === 'gps') {
      startGPSTracking();
    }

    return () => {
      if (geoWatchIdRef.current) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete window.setMapLocation;
    };
  }, [locationMode]);

  useEffect(() => {
    const showEvacuationRoute = async () => {
      if (!userLocation) return;
      
      const map = mapInstanceRef.current;
      const { lat, lng } = userLocation;
      
      try {
        const nearest = await getNearestEvacuationPoint(lat, lng);
        
        if (nearest) {
          if (evacuationMarkerRef.current) {
            map.removeLayer(evacuationMarkerRef.current);
          }
          if (window.currentRoute) {
            map.removeLayer(window.currentRoute);
          }
          
          const routeData = await floodAnalysisAPI.getEvacuationRoute(
            [lat, lng], 
            [nearest.lat, nearest.lon]
          );
          
          evacuationMarkerRef.current = L.marker([nearest.lat, nearest.lon], { icon: evacuationIcon }).addTo(map);
          
          if (routeData.leafletRoute && routeData.leafletRoute.coordinates) {
            const routeCoords = routeData.leafletRoute.coordinates.map(coord => [coord[1], coord[0]]);
            
            window.currentRoute = L.polyline(routeCoords, {
              color: routeData.riskLevel === 'HIGH' ? 'red' : routeData.riskLevel === 'MEDIUM' ? 'orange' : 'blue',
              weight: 5,
              opacity: 0.8
            }).addTo(map);
            
            map.fitBounds(window.currentRoute.getBounds(), { padding: [20, 20] });
          }
          
          window.dispatchEvent(new CustomEvent('evacuationFound', { 
            detail: { 
              ...nearest, 
              routeInfo: {
                distance: routeData.routeDistance,
                duration: routeData.routeDuration,
                riskLevel: routeData.riskLevel,
                warnings: routeData.warnings
              }
            } 
          }));
        }
      } catch (error) {
        console.error('Error finding evacuation route:', error);
      }
    };

    const toggleDistressCalls = async (show) => {
      if (show) {
        try {
          console.log('Fetching distress calls...');
          const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/distress-calls');
          console.log('Response status:', response.status);
          const result = await response.json();
          console.log('API Response:', result);
          const distressCalls = result.calls || [];
          console.log('Distress calls found:', distressCalls.length);
          
          alert(`Found ${distressCalls.length} distress calls:\n${JSON.stringify(distressCalls, null, 2)}`);
          
          const markers = distressCalls.map(call => {
            console.log('Creating marker for call:', call);
            const marker = L.marker([call.latitude, call.longitude], { icon: distressIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div>
                <strong>🚨 Distress Call</strong><br>
                <small>📅 ${new Date(call.call_time).toLocaleString()}</small><br>
                ${call.user_message ? `💬 ${call.user_message}` : '📍 Location assistance needed'}
              </div>
            `);
            return marker;
          });
          
          setDistressMarkers(markers);
        } catch (error) {
          console.error('Error fetching distress calls:', error);
          alert('Error fetching distress calls: ' + error.message);
        }
      } else {
        distressMarkers.forEach(marker => {
          mapInstanceRef.current.removeLayer(marker);
        });
        setDistressMarkers([]);
      }
    };
    
    const getCityRadius = async (cityName, lat, lng) => {
      try {
        const overpassQuery = `
          [out:json][timeout:25];
          (
            relation["name"="${cityName}"]["place"~"city|town"]["admin_level"~"8|9|10"](around:50000,${lat},${lng});
            way["name"="${cityName}"]["place"~"city|town"](around:50000,${lat},${lng});
          );
          out geom;
        `;
        
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpassQuery
        });
        
        const data = await response.json();
        
        if (data.elements && data.elements.length > 0) {
          const element = data.elements[0];
          
          // Calculate approximate radius from bounding box
          if (element.bounds) {
            const { minlat, minlon, maxlat, maxlon } = element.bounds;
            const width = (maxlon - minlon) * 111320 * Math.cos(lat * Math.PI / 180);
            const height = (maxlat - minlat) * 110540;
            return Math.max(width, height) / 2;
          }
        }
        
        // Default radius if no data found
        return 5000;
      } catch (error) {
        console.error('Error fetching city data:', error);
        return 5000;
      }
    };
    
    const showFloodAnalysis = async () => {
      try {
        const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/flood-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getFloodData' })
        });
        
        const floodData = await response.json();
        
        // Remove existing circles
        floodCircles.forEach(circle => {
          mapInstanceRef.current.removeLayer(circle);
        });
        
        // Add new circles with dynamic radius
        const circles = await Promise.all(floodData.cities.map(async (city) => {
          const color = city.accuracy >= 80 ? 'red' : city.accuracy >= 60 ? 'yellow' : 'green';
          const radius = await getCityRadius(city.name, city.lat, city.lng);
          
          const circle = L.circle([city.lat, city.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            radius: radius
          }).addTo(mapInstanceRef.current)
          .bindPopup(`
            <div>
              <strong>${city.name}</strong><br>
              Flood Accuracy: ${city.accuracy}%<br>
              Risk Level: ${city.accuracy >= 80 ? 'High' : city.accuracy >= 60 ? 'Medium' : 'Low'}<br>
              Coverage: ${Math.round(radius/1000)}km radius
            </div>
          `);
          
          return circle;
        }));        
        setFloodCircles(circles);
      } catch (error) {
        console.error('Error fetching flood analysis:', error);
      }
    };
    
    window.showEvacuationRoute = showEvacuationRoute;
    window.toggleDistressCalls = toggleDistressCalls;
    window.showFloodAnalysis = showFloodAnalysis;

    return () => {
      delete window.showEvacuationRoute;
      delete window.toggleDistressCalls;
      delete window.showFloodAnalysis;
    };
  }, [userLocation, distressMarkers]);

  return (
    <div id="map" ref={mapRef} />
  );
};

export default MapComponent;