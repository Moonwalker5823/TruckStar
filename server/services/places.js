const NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

async function fetchPlaceDetails(placeId) {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'website,formatted_phone_number,url',
    key: process.env.GOOGLE_API_KEY,
  });
  try {
    const response = await fetch(`${DETAILS_URL}?${params}`);
    if (!response.ok) return {};
    const data = await response.json();
    return data.result || {};
  } catch {
    return {};
  }
}

export async function fetchNearbyFoodTrucks(lat, lng) {
  const params = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: '5000',
    keyword: 'food truck',
    key: process.env.GOOGLE_API_KEY,
  });

  const response = await fetch(`${NEARBY_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API returned status: ${data.status}`);
  }

  const places = (data.results || []).filter(place => place.geometry?.location);

  const details = await Promise.allSettled(
    places.map(place => fetchPlaceDetails(place.place_id)),
  );

  return places.map((place, i) => {
    const detail = details[i].status === 'fulfilled' ? details[i].value : {};
    return {
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      cuisine: place.types?.[0] ?? null,
      photo_reference: place.photos?.[0]?.photo_reference ?? null,
      website: detail.website ?? null,
      phone: detail.formatted_phone_number ?? null,
      maps_url: detail.url ?? null,
    };
  });
}
