import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import EvacuationMarkerImg from '../public/evacuation-icon-2x.png'; 
import EvacuationMarkerShadow from '../public/evacuation-icon-shadow.png'; 
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { getNearestEvacuationPoint } from './utils/GetNearestEvacuationPoint';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const evacuationMarkerRef = useRef(null);
  const geoWatchIdRef = useRef(null);

  // Custom icon for evacuation point
  const evacuationIcon = L.icon({
    iconUrl: EvacuationMarkerImg,
    iconSize: [25, 41], 
    iconAnchor: [16, 32], // Point of the icon which corresponds to marker's location
    popupAnchor: [0, -32], // Position of the popup relative to icon
     shadowUrl: EvacuationMarkerShadow,
    shadowSize: [30, 41],
    shadowAnchor: [16, 32]
  });

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
    const success = async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy;

      const map = mapInstanceRef.current;

      // Remove old marker/circle
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        map.removeLayer(circleRef.current);
        map.removeLayer(evacuationMarkerRef.current);
      }

      // Add new marker and circle
      markerRef.current = L.marker([lat, lng]).addTo(map);
      circleRef.current = L.circle([lat, lng], { radius: acc }).addTo(map);

      const nearest = await getNearestEvacuationPoint(lat, lng);

      const bounds = L.latLngBounds([
        [lat, lng],                   // User's location
        [nearest.lat, nearest.lon],  // Evacuation point
        ]);

      map.fitBounds(bounds, { padding: [30, 30] });
      
      if (nearest) {
        evacuationMarkerRef.current = L.marker([nearest.lat, nearest.lon], { icon: evacuationIcon }).addTo(map);
      }
      
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
*/
