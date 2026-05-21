// Client-side Paddle.js helper. Imported only by "use client" components.
// Lazily initialises Paddle once with the public client token, then opens the
// hosted checkout overlay for a given plan.

import { initializePaddle } from "@paddle/paddle-js";

let paddlePromise = null;

// The client token encodes the stack: live_* → production, test_* → sandbox.
function clientEnvironment() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";
  return token.startsWith("test_") ? "sandbox" : "production";
}

export function getPaddle() {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment: clientEnvironment(),
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    });
  }
  return paddlePromise;
}

// Kick off checkout for a paid plan ("starter" | "growth" | "pro").
// Asks our API to create a transaction (carrying user_id in custom_data), then
// opens the Paddle overlay. Throws on auth/validation errors so callers can
// surface a message.
export async function startCheckout(plan) {
  const paddle = await getPaddle();
  if (!paddle) throw new Error("Payment system failed to load. Please refresh and try again.");

  const res = await fetch("/api/paddle/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || "Could not start checkout.");
  }

  const settings = {
    displayMode: "overlay",
    theme: "dark",
    successUrl: `${window.location.origin}/dashboard?upgraded=1`,
  };

  if (data.transaction_id) {
    // Preferred path — open the server-created transaction.
    paddle.Checkout.open({ settings, transactionId: data.transaction_id });
  } else {
    // Fallback — items-based overlay with client-set custom data.
    paddle.Checkout.open({
      settings,
      items: [{ priceId: data.price_id, quantity: 1 }],
      customer: data.email ? { email: data.email } : undefined,
      customData: { user_id: data.user_id, plan: data.plan },
    });
  }
}
