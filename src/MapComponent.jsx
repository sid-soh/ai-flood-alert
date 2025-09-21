import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerShadow from '../assets/user-marker-shadow.png'; 
import EvacuationMarkerShadow from '../assets/evacuation-icon-shadow.png';
import DistressMarker from '../assets/distress-marker.png'; 
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

  // Custom icon for regular marker 
  const markerIcon = L.icon({
    iconUrl: MarkerShadow,
    iconSize: [34, 41], 
    iconAnchor: [16, 32], // Point of the icon which corresponds to marker's location
    popupAnchor: [0, -32], // Position of the popup relative to icon
  });

  // Custom icon for evacuation point
  const evacuationIcon = L.icon({
    iconUrl: EvacuationMarkerShadow,
    iconSize: [34, 41], 
    iconAnchor: [16, 32], // Point of the icon which corresponds to marker's location
    popupAnchor: [0, -32], // Position of the popup relative to icon
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
      
      // Remove old markers
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        if (circleRef.current) map.removeLayer(circleRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map).bindPopup(name);
      
      // Store location
      setUserLocation({ lat, lng });
      
      map.setView([lat, lng], 13);
    };

    const startGPSTracking = () => {
      const success = (pos) => {
        updateMapLocation(pos.coords.latitude, pos.coords.longitude, 'Your Location');
        
        // Add accuracy circle for GPS
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

    // Expose function globally
    window.setMapLocation = setMapLocation;

    // Only start GPS if in GPS mode
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
    // Expose function globally for HTML button
    const showEvacuationRoute = async () => {
      if (!userLocation) return;
      
      const map = mapInstanceRef.current;
      const { lat, lng } = userLocation;
      
      try {
        console.log('Getting nearest evacuation point for:', lat, lng);
        const nearest = await getNearestEvacuationPoint(lat, lng);
        console.log('Nearest evacuation point:', nearest);
        
        if (nearest) {
          // Remove existing evacuation marker and route
          if (evacuationMarkerRef.current) {
            map.removeLayer(evacuationMarkerRef.current);
          }
          if (window.currentRoute) {
            map.removeLayer(window.currentRoute);
          }
          
          // Get AI-optimized route from backend with OSRM
          console.log('Calling API with:', [lat, lng], [nearest.lat, nearest.lon]);
          const routeData = await floodAnalysisAPI.getEvacuationRoute(
            [lat, lng], 
            [nearest.lat, nearest.lon]
          );
          
          console.log('API Response:', routeData); // Debug log
          
          // Add evacuation marker
          evacuationMarkerRef.current = L.marker([nearest.lat, nearest.lon], { icon: evacuationIcon }).addTo(map);
          
          // Display OSRM route if available
          if (routeData.leafletRoute && routeData.leafletRoute.coordinates) {
            const routeCoords = routeData.leafletRoute.coordinates.map(coord => [coord[1], coord[0]]);
            
            window.currentRoute = L.polyline(routeCoords, {
              color: routeData.riskLevel === 'HIGH' ? 'red' : routeData.riskLevel === 'MEDIUM' ? 'orange' : 'blue',
              weight: 5,
              opacity: 0.8
            }).addTo(map);
            
            // Fit bounds to show route
            map.fitBounds(window.currentRoute.getBounds(), { padding: [20, 20] });
          } else {
            // Fallback to simple bounds
            const bounds = L.latLngBounds([
              [lat, lng],
              [nearest.lat, nearest.lon]
            ]);
            map.fitBounds(bounds, { padding: [30, 30] });
          }
          
          // Show route info and warnings
          if (routeData.warnings && routeData.warnings.length > 0) {
            console.log('Route warnings:', routeData.warnings);
          }
          
          // Trigger evacuation info update via custom event
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

    window.showEvacuationRoute = showEvacuationRoute;
    
    // Distress calls functionality
    const toggleDistressCalls = async (show) => {
      if (show) {
        try {
          const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/distress-calls');
          const result = await response.json();
          const distressCalls = result.calls || [];
          
          const markers = distressCalls.map(call => {
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
        }
      } else {
        // Remove all distress markers
        distressMarkers.forEach(marker => {
          mapInstanceRef.current.removeLayer(marker);
        });
        setDistressMarkers([]);
      }
    };
    
    window.toggleDistressCalls = toggleDistressCalls;

    return () => {
      delete window.showEvacuationRoute;
      delete window.toggleDistressCalls;
    };
  }, [userLocation]);

  return (
    <div id="map" ref={mapRef} />
  );
};

export default MapComponent;

/*
*   Routing: Using Overpass API to search for certain keywords on the map
*   Keywords include: emergency=assembly_point, emergency=shelter, amenity=shelter + shelter_type=emergency
*   Keywords may include: building=public, building=school, landuse=recreation_ground, leisure=stadium
*
*   To look at the topography of the map to determine whether an area is safe for flooding:
*   OpenElevationAPI
*
*   When an area is affected, the AI will estimate the area of effect
*   Destination points will be queried through Overpass API
*   These will be marked with the distance from user and elevation data
*   AI will determine the suitable action, which point to go to 
*   Routing TBD
*   e from user and elevation data
*   AI will determine the suitable action, which point to go to 
*   Routing TBD
*/
