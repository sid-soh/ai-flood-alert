import React, { useEffect, useState } from 'react';
import { getNearestEvacuationPoint } from './utils/GetNearestEvacuationPoint';

const EvacuationInfo = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [evacuationPoint, setEvacuationPoint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!navigator.geolocation) {
        setError('Geolocation not supported.');
        return;
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ latitude, longitude });

        const point = await getNearestEvacuationPoint(latitude, longitude);
        if (point) {
          setEvacuationPoint(point);
        } else {
          setError('No evacuation point found nearby.');
        }
      }, (err) => {
        setError('Location access denied.');
      });
    };

    fetchInfo();
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!evacuationPoint) return <p>Finding nearest evacuation point...</p>;

  const { lat, lon, dist, tags } = evacuationPoint;

  return (
    <div>
      <h3>Nearest Evacuation Point</h3>
      <p><strong>Latitude:</strong> {lat}</p>
      <p><strong>Longitude:</strong> {lon}</p>
      <p><strong>Distance:</strong> {(dist / 1000).toFixed(2)} km</p>
      {tags.name && <p><strong>Name:</strong> {tags.name}</p>}
      {tags.emergency && <p><strong>Type:</strong> {tags.emergency}</p>}
    </div>
  );
};

export default EvacuationInfo;

/*
const EvacuationInfo = ({ evacuationPoint }) => {
  if (!evacuationPoint) return <div>No evacuation point selected yet.</div>;

  return (
    <div>
      <h2>Narest Evacuation Point</h2>
      <p>Name: {evacuationPoint.tags.name}</p>
      <p>Distance: {(evacuationPoint.dist / 1000).toFixed(2)} km</p>
      <p>Latitude: {evacuationPoint.lat}</p>
      <p>Longitude: {evacuationPoint.lon}</p>
    </div>
  );
};
*/