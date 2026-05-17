// POST /api/reviews/upload
// Bulk import past Google reviews from a CSV file.
// Accepts JSON body { csv: "<csv text>" } OR { rows: [{...}, ...] }.
// Dedup:
//   - Synthetic google_review_id = "csv:<md5(reviewer + content prefix)>" → unique-index catches resubmits.
//   - Cross-source: reviewer_name + content prefix match against existing rows.
//
// Accepted column names (case-insensitive, alias-tolerant):
//   reviewer_name | reviewer | name | author
//   stars         | rating
//   content       | comment | review | text
//   review_date   | date    | published

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";
import crypto from "crypto";

// ── Tiny CSV parser — handles quoted fields, commas inside quotes, escaped quotes ──
function parseCSV(text) {
  const rows = [];
  let cur = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else { field += c; }
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((cell) => cell !== ""));
}

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

const COLUMN_ALIASES = {
  reviewer_name: ["reviewer_name", "reviewer", "name", "author", "author_name", "from"],
  stars: ["stars", "rating", "score", "star"],
  content: ["content", "comment", "review", "text", "body", "review_text"],
  review_date: ["review_date", "date", "published", "publish_date", "posted", "time"],
};

function pickColumn(headers, target) {
  const aliases = COLUMN_ALIASES[target];
  for (const a of aliases) {
    const idx = headers.indexOf(a);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseStars(value) {
  if (value == null) return null;
  const n = parseFloat(String(value).replace(/[^\d.]/g, ""));
  if (isNaN(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function parseDate(value) {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Common Excel/locale variant "MM/DD/YYYY"
  const m = String(value).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const yy = m[3].length === 2 ? "20" + m[3] : m[3];
    const d2 = new Date(`${yy}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`);
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }
  return new Date().toISOString();
}

function sentimentFromStars(s) {
  if (s >= 4) return "positive";
  if (s <= 2) return "negative";
  return "neutral";
}

function dedupKey(userId, reviewerName, stars, content) {
  const hash = crypto
    .createHash("md5")
    .update(`${userId}:${(reviewerName || "").toLowerCase()}:${stars}:${(content || "").slice(0, 200)}`)
    .digest("hex");
  return `csv:${hash}`;
}

export async function POST(req) {
  try {
    // ── Auth ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();

    // ── Materialize rows from { csv } or { rows } ──
    let rows = [];
    if (typeof body?.csv === "string" && body.csv.trim()) {
      const raw = parseCSV(body.csv);
      if (raw.length === 0) return Response.json({ error: "CSV appears empty" }, { status: 400 });
      const headers = raw[0].map(normalizeHeader);
      const idxName = pickColumn(headers, "reviewer_name");
      const idxStars = pickColumn(headers, "stars");
      const idxContent = pickColumn(headers, "content");
      const idxDate = pickColumn(headers, "review_date");
      if (idxStars === -1 || idxContent === -1) {
        return Response.json({
          error: `CSV must include a stars/rating column and a content/comment column. Got headers: ${headers.join(", ")}`,
        }, { status: 400 });
      }
      for (let i = 1; i < raw.length; i++) {
        const r = raw[i];
        rows.push({
          reviewer_name: idxName === -1 ? "Anonymous" : (r[idxName] || "Anonymous"),
          stars: r[idxStars],
          content: r[idxContent] || "",
          review_date: idxDate === -1 ? "" : r[idxDate],
        });
      }
    } else if (Array.isArray(body?.rows)) {
      rows = body.rows;
    } else {
      return Response.json({ error: "Body must include csv (string) or rows (array)" }, { status: 400 });
    }

    if (rows.length === 0) return Response.json({ error: "No data rows found" }, { status: 400 });
    if (rows.length > 1000) return Response.json({ error: "Max 1000 rows per upload" }, { status: 400 });

    const supa = createServiceClient();

    let inserted = 0;
    let skippedDup = 0;
    let skippedInvalid = 0;
    const errors = [];

    // ── Pull existing fingerprints for cross-source dedup (single round-trip) ──
    const { data: existing } = await supa
      .from("reviews")
      .select("reviewer_name, content")
      .eq("user_id", user.id);
    const seen = new Set(
      (existing || []).map((r) =>
        `${(r.reviewer_name || "").toLowerCase()}:${(r.content || "").slice(0, 200).toLowerCase()}`
      )
    );

    for (const row of rows) {
      const stars = parseStars(row.stars);
      const content = String(row.content || "").trim();
      const reviewerName = String(row.reviewer_name || "Anonymous").trim() || "Anonymous";

      if (!stars || !content) { skippedInvalid++; continue; }

      const fingerprint = `${reviewerName.toLowerCase()}:${content.slice(0, 200).toLowerCase()}`;
      if (seen.has(fingerprint)) { skippedDup++; continue; }

      const synthId = dedupKey(user.id, reviewerName, stars, content);
      const review = {
        user_id: user.id,
        reviewer_name: reviewerName,
        stars,
        content,
        source: "google",
        sentiment: sentimentFromStars(stars),
        is_crisis: stars <= 2,
        replied: false,
        google_review_id: synthId,
        review_date: parseDate(row.review_date),
        // Bulk-imported historical reviews are explicitly user-aware — mark
        // as already-notified so the daily cron never queues emails for them.
        notified_at: new Date().toISOString(),
      };

      const { error: insErr } = await supa.from("reviews").insert(review);
      if (insErr) {
        if (insErr.code === "23505") { skippedDup++; continue; }
        errors.push({ row, error: insErr.message });
        continue;
      }
      seen.add(fingerprint);
      inserted++;
    }

    return Response.json({
      ok: true,
      inserted,
      skipped_duplicates: skippedDup,
      skipped_invalid: skippedInvalid,
      total: rows.length,
      errors,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
