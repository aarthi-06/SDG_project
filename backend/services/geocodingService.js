async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEOCODING_API_KEY is missing from environment variables"
    );
  }

  const url =
    "https://maps.googleapis.com/maps/api/geocode/json" +
    `?address=${encodeURIComponent(address)}` +
    `&region=in` +
    `&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Geocoding request failed with HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (data.status === "ZERO_RESULTS") {
    return {
      success: false,
      status: "ZERO_RESULTS",
      reason: `No location found for: ${address}`
    };
  }

  if (data.status !== "OK") {
    throw new Error(
      data.error_message ||
      `Google Geocoding failed with status: ${data.status}`
    );
  }

  const result = data.results[0];

  return {
    success: true,
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    resolvedAddress: result.formatted_address,
    placeId: result.place_id,
    locationType: result.geometry.location_type
  };
}

module.exports = {
  geocodeAddress
};