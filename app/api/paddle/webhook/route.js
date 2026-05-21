// POST /api/paddle/webhook
// Receives Paddle Billing notifications and keeps profiles in sync with the
// customer's subscription state.
//
//   subscription.created / .updated / .activated → set profiles.plan + status + expiry
//   subscription.canceled  (also handles the "cancelled" spelling) → drop to free_trial
//   transaction.completed  → confirm payment, ensure the paid plan is applied
//
// The owning user is carried through Paddle `custom_data.user_id` (set at
// checkout). As a fallback we match an existing profile by paddle_customer_id.
//
// Signature is verified with PADDLE_WEBHOOK_SECRET when that env var is set.

import { createServiceClient } from "@/lib/supabase-server";
import { planForItems, verifyPaddleSignature } from "@/lib/paddle";

// Paddle status → our profiles.subscription_status. Kept as-is; column allows
// the common Paddle values plus the British "cancelled" alias.
const VALID_PLANS = new Set(["free_trial", "starter", "growth", "pro"]);

// Resolve which profile a Paddle event belongs to.
async function resolveUserId(supa, data) {
  const fromCustom = data?.custom_data?.user_id;
  if (fromCustom) return fromCustom;

  const customerId = data?.customer_id;
  if (customerId) {
    const { data: row } = await supa
      .from("profiles")
      .select("id")
      .eq("paddle_customer_id", customerId)
      .maybeSingle();
    if (row?.id) return row.id;
  }
  return null;
}

export async function POST(req) {
  try {
    // Raw body is required for signature verification — read it before parsing.
    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature");

    const { ok, verified } = verifyPaddleSignature(rawBody, signature);
    if (!ok) {
      console.warn("[paddle/webhook] signature verification failed");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (!verified) {
      console.warn("[paddle/webhook] PADDLE_WEBHOOK_SECRET not set — signature NOT verified");
    }

    const event = JSON.parse(rawBody);
    const type = event?.event_type;
    const data = event?.data || {};
    console.log(`[paddle/webhook] event=${type} id=${event?.event_id || "?"}`);

    const supa = createServiceClient();
    const userId = await resolveUserId(supa, data);

    if (!userId) {
      // Nothing we can map this to — ack so Paddle doesn't keep retrying.
      console.warn(`[paddle/webhook] no user_id resolvable for event=${type}`);
      return Response.json({ ok: true, mapped: false });
    }

    switch (type) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated":
      case "subscription.resumed":
      case "subscription.trialing":
      case "subscription.past_due":
      case "subscription.paused": {
        const status = data.status; // active | trialing | past_due | paused | canceled
        const plan = planForItems(data.items);
        const expiresAt = data?.current_billing_period?.ends_at || null;

        const update = {
          paddle_subscription_id: data.id || null,
          paddle_customer_id: data.customer_id || null,
          subscription_status: status || null,
          plan_expires_at: expiresAt,
        };
        // Only move the plan when Paddle reports an entitled state and we
        // recognise the price. A paused/past_due sub keeps prior plan flag but
        // records the status so middleware can react.
        if (plan && VALID_PLANS.has(plan) && (status === "active" || status === "trialing")) {
          update.plan = plan;
        } else if (status === "canceled") {
          update.plan = "free_trial";
        }

        const { error } = await supa.from("profiles").update(update).eq("id", userId);
        if (error) throw new Error(error.message);
        console.log(`[paddle/webhook]   updated user=${userId} → plan=${update.plan ?? "(unchanged)"} status=${status}`);
        break;
      }

      case "subscription.canceled":
      case "subscription.cancelled": {
        const { error } = await supa
          .from("profiles")
          .update({
            plan: "free_trial",
            subscription_status: "canceled",
            plan_expires_at: data?.current_billing_period?.ends_at || null,
          })
          .eq("id", userId);
        if (error) throw new Error(error.message);
        console.log(`[paddle/webhook]   user=${userId} subscription canceled → free_trial`);
        break;
      }

      case "transaction.completed": {
        // Payment confirmed. Make sure the paid plan is applied (safety net in
        // case subscription.created arrived without custom_data).
        const plan = planForItems(data.items);
        const update = {
          paddle_customer_id: data.customer_id || null,
          subscription_status: "active",
        };
        if (data.subscription_id) update.paddle_subscription_id = data.subscription_id;
        if (data?.billing_period?.ends_at) update.plan_expires_at = data.billing_period.ends_at;
        if (plan && VALID_PLANS.has(plan)) update.plan = plan;

        const { error } = await supa.from("profiles").update(update).eq("id", userId);
        if (error) throw new Error(error.message);
        console.log(`[paddle/webhook]   user=${userId} payment completed → plan=${update.plan ?? "(unchanged)"}`);
        break;
      }

      default:
        console.log(`[paddle/webhook]   ignored event=${type}`);
    }

    return Response.json({ ok: true, mapped: true });
  } catch (err) {
    console.error("[paddle/webhook] fatal:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
