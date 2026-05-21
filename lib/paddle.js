// Shared Paddle (Billing) helpers used by the checkout + webhook routes.
//
// Server side talks to the Paddle REST API directly with fetch (no SDK needed),
// authenticated with PADDLE_API_KEY. The browser uses @paddle/paddle-js with
// NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to render the checkout overlay.

import crypto from "crypto";

// Paddle has two completely separate stacks. PADDLE_ENVIRONMENT picks the host.
export const PADDLE_ENV = process.env.PADDLE_ENVIRONMENT === "sandbox" ? "sandbox" : "production";
export const PADDLE_API_BASE =
  PADDLE_ENV === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

// Map our internal plan keys ↔ Paddle price IDs (from env).
export const PRICE_BY_PLAN = {
  starter: process.env.PADDLE_STARTER_PRICE_ID,
  growth: process.env.PADDLE_GROWTH_PRICE_ID,
  pro: process.env.PADDLE_PRO_PRICE_ID,
};

export const PLAN_BY_PRICE = Object.fromEntries(
  Object.entries(PRICE_BY_PLAN)
    .filter(([, id]) => !!id)
    .map(([plan, id]) => [id, plan])
);

export function priceIdForPlan(plan) {
  return PRICE_BY_PLAN[plan] || null;
}

// Given the items array on a Paddle subscription/transaction, resolve which of
// our plans it corresponds to (first recognised price wins).
export function planForItems(items) {
  for (const it of items || []) {
    const priceId = it?.price?.id || it?.price_id;
    if (priceId && PLAN_BY_PRICE[priceId]) return PLAN_BY_PRICE[priceId];
  }
  return null;
}

// Authenticated call to the Paddle REST API. Returns parsed JSON; throws on
// non-2xx with the Paddle error detail so callers can surface it.
export async function paddleFetch(path, { method = "GET", body } = {}) {
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error("PADDLE_API_KEY is not configured");

  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.error?.detail || json?.error?.code || `HTTP ${res.status}`;
    throw new Error(`Paddle API ${method} ${path} failed: ${detail}`);
  }
  return json;
}

// Verify a Paddle webhook signature.
//   header format: "ts=<unix>;h1=<hmac-sha256-hex>"
//   signed payload: "<ts>:<rawBody>" hashed with the webhook secret key.
// Returns true when the secret is unset (verification disabled) so the webhook
// still functions before the destination secret has been wired up — set
// PADDLE_WEBHOOK_SECRET in production to enforce it.
export function verifyPaddleSignature(rawBody, signatureHeader) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return { ok: true, verified: false };
  if (!signatureHeader) return { ok: false, verified: false };

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const ts = parts.ts;
  const h1 = parts.h1;
  if (!ts || !h1) return { ok: false, verified: false };

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  // Constant-time compare.
  const a = Buffer.from(expected);
  const b = Buffer.from(h1);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { ok, verified: true };
}
