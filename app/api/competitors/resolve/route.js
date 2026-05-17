// POST /api/competitors/resolve
// Body: { url: "<google maps link>" }
//
// Resolves a user-pasted Google Maps URL (short or long) to a Place ID and
// returns a preview the user can confirm before tracking the competitor.
//
// Supported URL shapes:
//   - https://maps.app.goo.gl/<short>             (modern short link)
//   - https://goo.gl/maps/<short>                  (legacy short link)
//   - https://www.google.com/maps/place/<name>/@lat,lng,zoom/data=...
//   - https://maps.google.com/?cid=<id>
//   - https://www.google.com/maps?q=place_id:<ChIJ...>
//
// Strategy:
//   1. Follow redirects so short links become canonical /maps/place/... URLs.
//   2. Extract place name + coordinates from the canonical URL.
//   3. If we found a literal place_id (ChIJ... pattern), use it directly.
//   4. Otherwise call Places API New `searchText` with the name biased to
//      the extracted coordinates, take the top match.
//   5. Hydrate full details (name, address, rating, count, maps URI).

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

function isGoogleMapsHost(host) {
  return (
    host.endsWith("google.com") ||
    host.endsWith("google.co.uk") ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host.endsWith(".goo.gl") ||
    host.endsWith("maps.google.com")
  );
}

async function followRedirects(rawUrl) {
  // fetch() in the Vercel runtime follows redirects automatically; res.url
  // reports the final URL after the chain. For maps.app.goo.gl this lands
  // on a /maps/place/... canonical URL.
  const res = await fetch(rawUrl, {
    method: "GET",
    redirect: "follow",
    headers: {
      // Some Google Maps share links return an HTML interstitial unless we
      // present as a real browser.
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });
  return res.url;
}

function extractFromCanonical(canonicalUrl) {
  const out = { name: null, coords: null, placeIdHint: null };
  try {
    const u = new URL(canonicalUrl);

    // ChIJ... direct place_id in query
    for (const k of ["place_id", "ftid", "q"]) {
      const v = u.searchParams.get(k) || "";
      const m = v.match(/(?:place_id:)?(ChIJ[A-Za-z0-9_-]{20,})/);
      if (m) { out.placeIdHint = m[1]; break; }
    }

    // /maps/place/<NAME>/@lat,lng
    const path = decodeURIComponent(u.pathname);
    const placeMatch = path.match(/\/place\/([^/]+)/);
    if (placeMatch) {
      out.name = placeMatch[1].replace(/\+/g, " ").trim();
    }
    const coordsMatch = path.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      out.coords = { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
    }

    // data=...!1s0x<hex>:0x<hex>... — hex pair → not a usable place_id directly,
    // but presence implies the canonical URL is good enough for searchText.
  } catch { /* ignore */ }
  return out;
}

async function fetchPlaceDetails(placeId, apiKey) {
  const res = await fetch(`${PLACES_DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,primaryTypeDisplayName",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Places details ${res.status}`);
  }
  return data;
}

async function searchByText({ apiKey, query, coords }) {
  const body = { textQuery: query, maxResultCount: 1 };
  if (coords) {
    body.locationBias = {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius: 200,
      },
    };
  }
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Places searchText ${res.status}`);
  }
  return (data.places || [])[0] || null;
}

function shapeResult(place) {
  return {
    place_id: place.id,
    name: place.displayName?.text || "",
    address: place.formattedAddress || "",
    rating: typeof place.rating === "number" ? place.rating : null,
    user_rating_count: place.userRatingCount ?? null,
    maps_uri: place.googleMapsUri || null,
    type: place.primaryTypeDisplayName?.text || null,
  };
}

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) return Response.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });

    const { url: rawUrl } = await req.json();
    if (!rawUrl || typeof rawUrl !== "string") {
      return Response.json({ error: "Paste a Google Maps URL" }, { status: 400 });
    }

    // ── Light auth check: signed-in only (avoids drive-by abuse of the Places API key) ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    let candidate;
    try {
      candidate = new URL(rawUrl.trim());
    } catch {
      return Response.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }
    if (!isGoogleMapsHost(candidate.hostname)) {
      return Response.json({
        error: "Only Google Maps links are supported (maps.app.goo.gl or google.com/maps/...)",
      }, { status: 400 });
    }

    // ── Resolve short link to canonical ──
    let canonical = candidate.toString();
    if (candidate.hostname === "maps.app.goo.gl" || candidate.hostname.endsWith(".goo.gl") || candidate.hostname === "goo.gl") {
      try {
        canonical = await followRedirects(canonical);
        console.log("[competitors/resolve] short link →", canonical);
      } catch (e) {
        return Response.json({ error: `Couldn't follow the short link: ${e.message}` }, { status: 400 });
      }
    }

    const parsed = extractFromCanonical(canonical);
    console.log("[competitors/resolve] parsed:", parsed);

    // ── Path A: direct place_id hint ──
    if (parsed.placeIdHint) {
      try {
        const details = await fetchPlaceDetails(parsed.placeIdHint, apiKey);
        return Response.json({ ok: true, preview: shapeResult(details), source: "place_id" });
      } catch (e) {
        console.warn("[competitors/resolve] direct place_id failed:", e.message);
        // fall through to text search
      }
    }

    // ── Path B: text search with coords bias ──
    if (!parsed.name) {
      return Response.json({
        error: "Couldn't find a place name in that URL. Try opening the listing in Google Maps and copying the full Share link.",
      }, { status: 400 });
    }

    let place;
    try {
      place = await searchByText({ apiKey, query: parsed.name, coords: parsed.coords });
    } catch (e) {
      return Response.json({ error: `Search failed: ${e.message}` }, { status: 500 });
    }
    if (!place) {
      return Response.json({
        error: `Couldn't find "${parsed.name}" on Google Places. Try a different URL.`,
      }, { status: 404 });
    }

    return Response.json({ ok: true, preview: shapeResult(place), source: "text_search" });
  } catch (err) {
    console.error("[competitors/resolve] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
