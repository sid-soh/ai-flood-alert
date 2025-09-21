import React, { useState, useEffect } from 'react';

const EvacuationInfo = () => {
  const [evacuationPoint, setEvacuationPoint] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEvacuationFound = (event) => {
      setEvacuationPoint(event.detail);
    };

    window.addEventListener('evacuationFound', handleEvacuationFound);
    
    return () => {
      window.removeEventListener('evacuationFound', handleEvacuationFound);
    };
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!evacuationPoint) return;

  const { lat, lon, dist, tags } = evacuationPoint;

  return (
    <div id="evac-info">
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

