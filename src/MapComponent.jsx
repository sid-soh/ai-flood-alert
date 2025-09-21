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
      
      // Show flood risk circles automatically
      setTimeout(() => {
        showFloodRiskCircles();
      }, 1000);
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

    const showFloodRiskCircles = async () => {
      try {
        const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/flood-status');
        const result = await response.json();
        
        // Remove existing circles
        floodCircles.forEach(circle => {
          mapInstanceRef.current.removeLayer(circle);
        });
        
        // City size mapping (approximate population/importance)
        const citySizes = {
          'Kota Kinabalu': 15000,  // Capital, largest
          'Sandakan': 12000,       // Major port city
          'Tawau': 10000,          // Major city
          'Lahad Datu': 8000,      // Medium city
          'Keningau': 7000,        // Medium city
          'Semporna': 6000,        // Smaller city
          'Kudat': 5000,           // Smaller city
          'Beaufort': 6000,        // Medium town
          'Papar': 5000,           // Small town
          'Ranau': 4000            // Small town
        };
        
        // Show circles for HIGH and MEDIUM risk cities
        const riskCities = result.cities.filter(city => 
          city.riskLevel === 'HIGH' || city.riskLevel === 'MEDIUM'
        );
        
        const circles = riskCities.map(city => {
          const color = city.riskLevel === 'HIGH' ? 'red' : 'yellow';
          const radius = citySizes[city.name] || 5000;
          
          const circle = L.circle([city.lat, city.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            radius: radius,
            weight: 2
          }).addTo(mapInstanceRef.current)
          .bindPopup(`
            <div>
              <strong>${city.name}</strong><br>
              Risk Level: <span style="color: ${color}; font-weight: bold;">${city.riskLevel}</span><br>
              Accuracy: ${city.accuracy}%<br>
              Coverage: ${Math.round(radius/1000)}km radius
            </div>
          `);
          
          return circle;
        });
        
        setFloodCircles(circles);
      } catch (error) {
        console.error('Error fetching flood risk data:', error);
      }
    };

    window.setMapLocation = setMapLocation;
    window.showFloodAnalysis = showFloodRiskCircles;

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
      delete window.showFloodAnalysis;
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
          const response = await fetch('https://rt7id5217i.execute-api.ap-southeast-5.amazonaws.com/prod/distress-calls');
          const result = await response.json();
          const distressCalls = result.calls || [];

          const markers = distressCalls.map(call => {
            return L.marker([call.latitude, call.longitude], { icon: distressIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div>
                  <strong>🚨 Distress Call</strong><br>
                  <small>📅 ${new Date(call.call_time).toLocaleString()}</small><br>
                  ${call.user_message ? `💬 ${call.user_message}` : '📍 Location assistance needed'}
                </div>
              `);
          });
          
          setDistressMarkers(markers);
        } catch (error) {
          console.error('Error fetching distress calls:', error);
        }
      } else {
        distressMarkers.forEach(marker => {
          mapInstanceRef.current.removeLayer(marker);
        });
        setDistressMarkers([]);
      }
    };

    window.showEvacuationRoute = showEvacuationRoute;
    window.toggleDistressCalls = toggleDistressCalls;

    return () => {
      delete window.showEvacuationRoute;
      delete window.toggleDistressCalls;
    };
  }, [userLocation, distressMarkers]);

  return (
    <div id="map" ref={mapRef} />
  );
};

export default MapComponent;