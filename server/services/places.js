const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

export async function fetchNearbyFoodTrucks(lat, lng) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '5000',
    keyword: 'food truck',
    key: process.env.GOOGLE_API_KEY,
  });

  const response = await fetch(`${PLACES_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API returned status: ${data.status}`);
  }

  return (data.results || [])
    .filter(place => place.geometry?.location)
    .map(place => ({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      cuisine: place.types?.[0] ?? null,
    }));
}
