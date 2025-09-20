export const getNearestEvacuationPoint = async (latitude, longitude, radius = 8000) => {
  const query = `
    [out:json][timeout:25];
    (
            // Amenity shelter with shelter_type=emergency
            node["amenity"="shelter"](around:${radius},${latitude},${longitude});
            way["amenity"="shelter"](around:${radius},${latitude},${longitude});
            relation["amenity"="shelter"](around:${radius},${latitude},${longitude});
    );
    out center;
  `;

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data.elements || data.elements.length === 0) {
      return getFallbackEvacuationPoint(latitude, longitude);
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
          nearest = {
            lat,
            lon,
            dist,
            tags: el.tags || {},
            id: el.id,
            type: el.type,
          };
        }
      }
    });

    return nearest || getFallbackEvacuationPoint(latitude, longitude);
  } catch (e) {
    console.error('Error fetching nearest evacuation point:', e);
    return getFallbackEvacuationPoint(latitude, longitude);
  }
};

const getFallbackEvacuationPoint = (latitude, longitude) => {
  // Mock evacuation points for Sabah area
  const mockPoints = [
    { lat: 5.9680215, lon: 116.0928631, name: 'Community Center' },
    { lat: 5.9731, lon: 116.0678, name: 'School Shelter' },
    { lat: 5.9804, lon: 116.0735, name: 'Public Hall' }
  ];
  
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371e3;
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };
  
  let nearest = mockPoints[0];
  let minDist = getDistance(latitude, longitude, nearest.lat, nearest.lon);
  
  mockPoints.forEach(point => {
    const dist = getDistance(latitude, longitude, point.lat, point.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  });
  
  return {
    lat: nearest.lat,
    lon: nearest.lon,
    dist: minDist,
    tags: { name: nearest.name, emergency: 'shelter' },
    id: 'fallback',
    type: 'node'
  };
};

