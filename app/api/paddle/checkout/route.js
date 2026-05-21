// POST /api/paddle/checkout
// Starts a Paddle checkout for the signed-in user.
//   body: { plan: "starter" | "growth" | "pro" }
//
// We create a Paddle transaction server-side so the user_id is attached as
// custom_data we control (the webhook reads it back to map the subscription to
// the right profile). The client opens the returned transaction_id in the
// Paddle.js overlay. If transaction creation isn't available we fall back to
// returning the price_id so the client can open an items-based checkout.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase-server";
import { priceIdForPlan, paddleFetch } from "@/lib/paddle";

const PAID_PLANS = new Set(["starter", "growth", "pro"]);

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan = body?.plan;

    if (!PAID_PLANS.has(plan)) {
      return Response.json({ error: "Invalid plan" }, { status: 400 });
    }
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return Response.json({ error: `Price ID for plan "${plan}" is not configured` }, { status: 500 });
    }

    // ── Authenticate the current user ──
    const cookieStore = await cookies();
    const userSupa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await userSupa.auth.getUser();
    if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

    // Reuse an existing Paddle customer if we've seen one for this profile.
    const supa = createServiceClient();
    const { data: profile } = await supa
      .from("profiles")
      .select("paddle_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

    const email = profile?.email || user.email || undefined;

    // Try to create a transaction (preferred — custom_data is server-controlled).
    try {
      const payload = {
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { user_id: user.id, plan },
      };
      if (profile?.paddle_customer_id) payload.customer_id = profile.paddle_customer_id;

      const txn = await paddleFetch("/transactions", { method: "POST", body: payload });
      const transactionId = txn?.data?.id;
      if (transactionId) {
        return Response.json({ ok: true, transaction_id: transactionId, plan, price_id: priceId });
      }
    } catch (err) {
      // Fall through to the items-based overlay path below.
      console.warn("[paddle/checkout] transaction create failed, falling back to price_id:", err.message);
    }

    // Fallback: client opens an items-based overlay with these values.
    return Response.json({
      ok: true,
      transaction_id: null,
      plan,
      price_id: priceId,
      email,
      user_id: user.id,
    });
  } catch (err) {
    console.error("[paddle/checkout] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
