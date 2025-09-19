import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const geoWatchIdRef = useRef(null);

  useEffect(() => {
    // Initialize the map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([5.518, 116.768], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current);
    }

    // Success callback
    const success = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      const map = mapInstanceRef.current;

      // Remove old marker/circle
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        map.removeLayer(circleRef.current);
      }

      // Add new marker and circle
      markerRef.current = L.marker([lat, lng]).addTo(map);
      circleRef.current = L.circle([lat, lng], { radius: acc }).addTo(map);

      map.fitBounds(circleRef.current.getBounds());
    };

    // Error callback
    const error = (err) => {
      if (err.code === 1) {
        alert('Please allow geolocation access.');
      }
    };

    // Start watching user's location
    if (navigator.geolocation) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(success, error);
    }

    // Cleanup function
    return () => {
      if (geoWatchIdRef.current) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div id="map" ref={mapRef} style={{ height: '500px', width: '100%' }} />
  );
};

export default MapComponent;