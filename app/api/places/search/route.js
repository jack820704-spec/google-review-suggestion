// POST /api/places/search
// Search Google Places (New API v1) by restaurant name + city.
// Returns the top matching businesses with id, name, address, rating.

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

    const { name, city, country } = await req.json();
    if (!name || !name.trim()) {
      return Response.json({ error: "Restaurant name is required" }, { status: 400 });
    }

    const textQuery = [name, city, country].filter(Boolean).join(" ").trim();

    const res = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery, maxResultCount: 5 }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data?.error?.message || "Google Places API error", details: data }, { status: res.status });
    }

    const results = (data.places || []).map((p) => ({
      place_id: p.id,
      name: p.displayName?.text || "",
      address: p.formattedAddress || "",
      rating: typeof p.rating === "number" ? p.rating : null,
      user_rating_count: p.userRatingCount ?? null,
      maps_uri: p.googleMapsUri || null,
      type: p.primaryTypeDisplayName?.text || null,
    }));

    return Response.json({ results });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
