// POST /api/reviews/smart-paste
// Body: { text: "<pasted reviews text>" }
//
// Uses OpenAI gpt-4o-mini to extract structured reviews from free-form text
// (e.g. a selection copied off a Google Maps reviews page), then dedups and
// bulk-inserts into the reviews table (place_id NULL, like CSV imports).
// Returns { inserted, skipped, total }.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import crypto from "crypto";

const SYSTEM_PROMPT = `Extract individual customer reviews from the following text. For each review identify: reviewer_name (string), stars (number 1-5), content (string), date (string or null). Return ONLY a JSON array, no other text. Example: [{"reviewer_name":"John","stars":5,"content":"Great food!","date":"2025-01-15"}]`;

function parseStars(v) {
  const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  if (isNaN(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function sentimentFromStars(s) {
  if (s >= 4) return "positive";
  if (s <= 2) return "negative";
  return "neutral";
}

function parseDate(v) {
  if (!v) return new Date().toISOString();
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
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

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text || "").trim();
    if (!text) return Response.json({ error: "No text provided" }, { status: 400 });
    // Guard against pathological inputs (Google review pages are long but not unbounded).
    const clipped = text.length > 24000 ? text.slice(0, 24000) : text;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    // ── Parse with gpt-4o-mini ──
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: clipped },
      ],
    });

    const rawOut = completion.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      // Be tolerant of stray prose / code fences around the JSON array.
      const start = rawOut.indexOf("[");
      const end = rawOut.lastIndexOf("]");
      if (start === -1 || end === -1 || end < start) throw new Error("no array");
      parsed = JSON.parse(rawOut.slice(start, end + 1));
    } catch {
      return Response.json(
        { error: "Could not detect any reviews in the pasted text. Try copying a cleaner selection of the reviews." },
        { status: 422 }
      );
    }
    if (!Array.isArray(parsed)) {
      return Response.json({ error: "Unexpected parse result. Please try again." }, { status: 422 });
    }
    // Cap to a sane batch size.
    const rows = parsed.slice(0, 500);

    const supa = createServiceClient();

    // ── Dedup against existing reviews (reviewer + content fingerprint) ──
    const { data: existing } = await supa
      .from("reviews")
      .select("reviewer_name, content")
      .eq("user_id", user.id);
    const seen = new Set(
      (existing || []).map((r) =>
        `${(r.reviewer_name || "").toLowerCase()}:${(r.content || "").slice(0, 200).toLowerCase()}`
      )
    );

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const stars = parseStars(row?.stars);
      const content = String(row?.content || "").trim();
      const reviewerName = String(row?.reviewer_name || "Anonymous").trim() || "Anonymous";
      if (!stars || !content) { skipped++; continue; }

      const fp = `${reviewerName.toLowerCase()}:${content.slice(0, 200).toLowerCase()}`;
      if (seen.has(fp)) { skipped++; continue; }

      const synthId = "paste:" + crypto.createHash("md5").update(`${user.id}:${fp}`).digest("hex");
      const { error: insErr } = await supa.from("reviews").insert({
        user_id: user.id,
        reviewer_name: reviewerName,
        stars,
        content,
        source: "google",
        // No clear place provenance — keep place_id NULL so these stay visible.
        place_id: null,
        sentiment: sentimentFromStars(stars),
        is_crisis: stars <= 2,
        replied: false,
        google_review_id: synthId,
        review_date: parseDate(row?.date),
        notified_at: new Date().toISOString(),
      });
      if (insErr) { skipped++; continue; }
      seen.add(fp);
      inserted++;
    }

    return Response.json({ ok: true, inserted, skipped, total: rows.length });
  } catch (err) {
    console.error("[reviews/smart-paste] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
