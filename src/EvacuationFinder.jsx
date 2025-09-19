import React, { useEffect, useState } from 'react';

const EvacuationFinder = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [closestPoint, setClosestPoint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371e3; // metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        const radius = 5000; // in meters, increase if necessary

        const query = `
          [out:json][timeout:25];
          (
            // Emergency shelters
            node["emergency"="shelter"](around:${radius},${latitude},${longitude});
            way["emergency"="shelter"](around:${radius},${latitude},${longitude});
            relation["emergency"="shelter"](around:${radius},${latitude},${longitude});

            // Amenity shelter with shelter_type=emergency
            node["amenity"="shelter"](around:${radius},${latitude},${longitude});
            way["amenity"="shelter"](around:${radius},${latitude},${longitude});
            relation["amenity"="shelter"](around:${radius},${latitude},${longitude});

          );
          out center;
        `;

        fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
        })
          .then(res => res.json())
          .then(data => {
            if (!data.elements || data.elements.length === 0) {
              setError('No evacuation points found nearby.');
              setLoading(false);
              return;
            }

            let minDist = Infinity;
            let nearest = null;

            data.elements.forEach(el => {
              const lat = el.lat || el.center?.lat;
              const lon = el.lon || el.center?.lon;

              if (lat != null && lon != null) {
                const dist = getDistance(latitude, longitude, lat, lon);
                if (dist < minDist) {
                  minDist = dist;
                  nearest = { lat, lon, dist, tags: el.tags || {} };
                }
              }
            });

            setClosestPoint(nearest);
            setLoading(false);
          })
          .catch(err => {
            console.error(err);
            setError('Error fetching evacuation data');
            setLoading(false);
          });
      },
      err => {
        setError('Error getting user location');
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {closestPoint ? (
        <div>
          <h2>Closest Evacuation Point</h2>
          <p>
            Latitude: {closestPoint.lat} <br />
            Longitude: {closestPoint.lon} <br />
            Distance: {(closestPoint.dist / 1000).toFixed(2)} km
          </p>
          {closestPoint.tags.name && (
            <p>Name: {closestPoint.tags.name}</p>
          )}
        </div>
      ) : (
        <p>No evacuation point found.</p>
      )}
    </div>
  );
};

export default EvacuationFinder;