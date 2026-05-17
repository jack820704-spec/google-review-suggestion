// POST /api/competitors/resolve
// Body: { url: "<google maps link>" }
//
// Resolves a user-pasted Google Maps URL (short or long) to a Place ID and
// returns a preview the user can confirm before tracking the competitor.
//
// Supported URL shapes:
//   - https://maps.app.goo.gl/<short>             (modern short link)
//   - https://goo.gl/maps/<short>                  (legacy short link)
//   - https://www.google.com/maps/place/<name>/@lat,lng,zoom/data=...!1s<hex>:<hex>!...
//   - https://maps.google.com/?cid=<decimal>
//   - https://www.google.com/maps?q=place_id:<ChIJ...>
//
// Strategy (in order, first hit wins):
//   1. Follow redirects → canonical /maps/place/... URL.
//   2. Extract any directly-usable place_id (ChIJ... in query).
//   3. Extract the FTID hex pair from `!1s<hex>:<hex>` data block — the
//      second hex is the CID in hex; convert to decimal and try the
//      `maps.google.com/?cid=<dec>` resolver in case it now yields a ChIJ.
//   4. Otherwise call Places API New `searchText` biased to the parsed
//      coords (5km radius) using the place name from `/place/<name>`.
//   5. Hydrate full details on the chosen place.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

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
  const res = await fetch(rawUrl, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA },
  });
  return res.url;
}

// Pull every identifier we can find out of a canonical Google Maps URL.
// Returns: { name, coords, chijId, ftidHex, cidDecimal, kgMid }
function extractFromCanonical(canonicalUrl) {
  const out = { name: null, coords: null, chijId: null, ftidHex: null, cidDecimal: null, kgMid: null };
  try {
    const u = new URL(canonicalUrl);

    // ChIJ-style place_id can appear in q, place_id, or ftid query params.
    for (const k of ["place_id", "ftid", "q"]) {
      const v = u.searchParams.get(k) || "";
      const m = v.match(/(?:place_id:)?(ChIJ[A-Za-z0-9_-]{20,})/);
      if (m) { out.chijId = m[1]; break; }
    }

    // ?cid= directly in query (rare in modern URLs, common in legacy share links)
    const cidParam = u.searchParams.get("cid");
    if (cidParam && /^\d+$/.test(cidParam)) out.cidDecimal = cidParam;

    const path = decodeURIComponent(u.pathname);

    // !1s<hex>:<hex> — feature ID pair. Second part is the CID in hex.
    const ftid = path.match(/!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/);
    if (ftid) {
      out.ftidHex = `${ftid[1]}:${ftid[2]}`;
      if (!out.cidDecimal) {
        try { out.cidDecimal = BigInt(ftid[2]).toString(); } catch { /* ignore */ }
      }
    }

    // !16s/g/<mid> — Knowledge Graph machine ID (kept for logs / fallback search)
    const kg = path.match(/!16s\/(g\/[A-Za-z0-9_]+)/);
    if (kg) out.kgMid = `/${kg[1]}`;

    // /maps/place/<NAME>/ — URL-encoded display name (CJK works after decodeURIComponent)
    const placeMatch = path.match(/\/place\/([^/]+)/);
    if (placeMatch) out.name = placeMatch[1].replace(/\+/g, " ").trim();

    // @lat,lng,zoom — viewport center, accurate enough for a 5km bias
    const coordsMatch = path.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      out.coords = { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
    }
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
  if (!res.ok) throw new Error(data?.error?.message || `Places details ${res.status}`);
  return data;
}

async function searchByText({ apiKey, query, coords, radius = 5000, maxResults = 5 }) {
  const body = { textQuery: query, maxResultCount: maxResults };
  if (coords) {
    body.locationBias = {
      circle: {
        center: { latitude: coords.lat, longitude: coords.lng },
        radius,
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
  if (!res.ok) throw new Error(data?.error?.message || `Places searchText ${res.status}`);
  return data.places || [];
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
    console.log("[competitors/resolve] STEP 1 input:", { rawUrl, type: typeof rawUrl });
    if (!rawUrl || typeof rawUrl !== "string") {
      return Response.json({ error: "Paste a Google Maps URL" }, { status: 400 });
    }

    // ── Auth ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });
    console.log("[competitors/resolve] STEP 2 auth ok user=", user.id);

    let candidate;
    try {
      candidate = new URL(rawUrl.trim());
    } catch {
      return Response.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
    }
    console.log("[competitors/resolve] STEP 3 parsed URL:", {
      host: candidate.hostname,
      path: candidate.pathname,
      search: candidate.search,
    });
    if (!isGoogleMapsHost(candidate.hostname)) {
      return Response.json({
        error: "Only Google Maps links are supported (maps.app.goo.gl, goo.gl/maps, or google.com/maps/...)",
      }, { status: 400 });
    }

    // ── Follow short/cid links to canonical /maps/place/ URL ──
    let canonical = candidate.toString();
    const needsRedirect =
      candidate.hostname === "maps.app.goo.gl" ||
      candidate.hostname.endsWith(".goo.gl") ||
      candidate.hostname === "goo.gl" ||
      candidate.searchParams.has("cid");
    if (needsRedirect) {
      try {
        canonical = await followRedirects(canonical);
        console.log("[competitors/resolve] STEP 4 followed →", canonical);
      } catch (e) {
        console.error("[competitors/resolve] STEP 4 redirect failed:", e.message);
        return Response.json({ error: `Couldn't follow the link: ${e.message}` }, { status: 400 });
      }
    } else {
      console.log("[competitors/resolve] STEP 4 no redirect needed, using:", canonical);
    }

    const parsed = extractFromCanonical(canonical);
    console.log("[competitors/resolve] STEP 5 extracted:", parsed);

    // ── Path A: ChIJ in URL → fetch details, done ──
    if (parsed.chijId) {
      console.log("[competitors/resolve] STEP 6a Path A direct ChIJ:", parsed.chijId);
      try {
        const details = await fetchPlaceDetails(parsed.chijId, apiKey);
        const shaped = [shapeResult(details)];
        console.log("[competitors/resolve] STEP 7a returning ChIJ result:", shaped[0]?.name);
        return Response.json({ ok: true, candidates: shaped, source: "place_id", parsed_name: parsed.name });
      } catch (e) {
        console.warn("[competitors/resolve] STEP 7a ChIJ lookup failed:", e.message);
        // fall through
      }
    }

    // ── Path B: hex FTID present → resolve via CID redirect, try to land on a ChIJ ──
    if (parsed.cidDecimal) {
      console.log("[competitors/resolve] STEP 6b Path B CID redirect:", parsed.cidDecimal);
      try {
        const cidUrl = `https://maps.google.com/?cid=${parsed.cidDecimal}`;
        const finalUrl = await followRedirects(cidUrl);
        console.log("[competitors/resolve] STEP 6b CID landed at:", finalUrl);
        const reparsed = extractFromCanonical(finalUrl);
        console.log("[competitors/resolve] STEP 6b CID re-extract:", reparsed);
        if (reparsed.chijId) {
          const details = await fetchPlaceDetails(reparsed.chijId, apiKey);
          const shaped = [shapeResult(details)];
          console.log("[competitors/resolve] STEP 7b returning CID→ChIJ result:", shaped[0]?.name);
          return Response.json({ ok: true, candidates: shaped, source: "cid", parsed_name: parsed.name });
        }
        // CID redirect didn't expose a ChIJ — but it may have given us better name/coords.
        if (!parsed.name && reparsed.name) parsed.name = reparsed.name;
        if (!parsed.coords && reparsed.coords) parsed.coords = reparsed.coords;
      } catch (e) {
        console.warn("[competitors/resolve] STEP 7b CID redirect failed:", e.message);
        // fall through
      }
    }

    // ── Path C: name + coords → searchText with 5km bias, retry wider if empty ──
    if (!parsed.name) {
      console.warn("[competitors/resolve] STEP 6c no name parsed, giving up");
      return Response.json({
        error: "Couldn't find a place name in that URL. Open the listing in Google Maps → tap Share → copy the link, then paste it again. Or search by name below.",
      }, { status: 400 });
    }

    console.log("[competitors/resolve] STEP 6c Path C searchText:", { name: parsed.name, coords: parsed.coords });
    let places = [];
    try {
      places = await searchByText({ apiKey, query: parsed.name, coords: parsed.coords, radius: 5000, maxResults: 5 });
      console.log("[competitors/resolve] STEP 7c searchText returned", places.length, "candidates (5km)");
      if (places.length === 0 && parsed.coords) {
        // Retry with much wider bias — sometimes the URL's @ coords are off-target
        places = await searchByText({ apiKey, query: parsed.name, coords: parsed.coords, radius: 50000, maxResults: 5 });
        console.log("[competitors/resolve] STEP 7c retry (50km) returned", places.length);
      }
      if (places.length === 0) {
        // Final retry with no bias at all — last chance for global places
        places = await searchByText({ apiKey, query: parsed.name, coords: null, maxResults: 5 });
        console.log("[competitors/resolve] STEP 7c retry (no bias) returned", places.length);
      }
    } catch (e) {
      console.error("[competitors/resolve] STEP 7c searchText failed:", e.message);
      return Response.json({ error: `Search failed: ${e.message}`, parsed_name: parsed.name }, { status: 500 });
    }
    if (places.length === 0) {
      return Response.json({
        error: `Couldn't find "${parsed.name}" on Google Places. Try the long URL or search by name below.`,
        parsed_name: parsed.name,
      }, { status: 404 });
    }

    const shaped = places.map(shapeResult);
    console.log("[competitors/resolve] STEP 8 final candidates:", shaped.map((p) => ({ id: p.place_id, name: p.name })));
    return Response.json({
      ok: true,
      candidates: shaped,
      source: "text_search",
      parsed_name: parsed.name,
    });
  } catch (err) {
    console.error("[competitors/resolve] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
