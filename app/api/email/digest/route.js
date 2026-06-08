// POST /api/email/digest
// Send one consolidated email containing multiple reviews + AI reply suggestions.
// Used for the first-time 5-review sync after a user connects their Google business.

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function buildDigestHtml({ restaurantName, items, isInitialSync }) {
  const styleNames = { warm: "Warm & Personal", professional: "Professional & Gracious", brief: "Brief & Direct" };

  const reviewBlocks = items.map(({ review, replies }, idx) => {
    const repliesHtml = Object.entries(replies || {})
      .map(
        ([style, text]) => `
          <div style="margin-bottom:14px;padding:14px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px">
            <div style="font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;margin-bottom:8px">${styleNames[style] || style}</div>
            <div style="font-size:13.5px;line-height:1.7;color:#a09888">${text}</div>
          </div>`
      )
      .join("");

    return `
      <div style="margin-bottom:28px;padding:22px;background:#1c1c22;border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#8a6e2f,#c9a84c);text-align:center;line-height:24px;color:#000;font-weight:700;font-size:12px">${idx + 1}</div>
          <div style="font-size:13.5px;font-weight:700;color:#f0ede6">${review.reviewer_name || "Anonymous"}</div>
          <div style="font-size:12.5px;color:#c9a84c;margin-left:auto">${starsHtml(review.stars)}</div>
        </div>
        <div style="padding:12px 14px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(201,168,76,0.4);border-radius:0 6px 6px 0;margin-bottom:16px">
          <p style="font-size:13.5px;line-height:1.7;color:#a09888;margin:0;font-style:italic">"${review.content}"</p>
        </div>
        <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#5a5550;margin-bottom:10px">💬 AI Suggested Replies</div>
        ${repliesHtml}
      </div>`;
  }).join("");

  const introCopy = isInitialSync
    ? `Welcome aboard! We've pulled your most recent ${items.length} Google reviews and drafted three reply styles for each one. Pick the voice that fits and paste it straight into Google.`
    : `Here are your latest ${items.length} reviews and AI-crafted reply suggestions.`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8a6e2f,#c9a84c);border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
      <span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">Revuly</span>
    </div>

    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#f0ede6;margin:0 0 6px">
      ${isInitialSync ? "🎉" : "📬"} Your ${items.length} Latest Reviews — ${restaurantName}
    </h1>
    <p style="font-size:13.5px;color:#a09888;margin:0 0 24px;line-height:1.65">${introCopy}</p>

    ${reviewBlocks}

    <div style="text-align:center;margin:32px 0 24px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none">Open Dashboard →</a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center">
      <p style="font-size:12px;color:#5a5550;margin:0">Revuly · AI-Powered Reputation Management · <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#5a5550;text-decoration:none">Manage notifications</a></p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req) {
  try {
    const { to, restaurantName, items, isInitialSync } = await req.json();
    if (!to || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Missing required fields (to, items)" }, { status: 400 });
    }

    const subject = isInitialSync
      ? `🎉 Welcome — ${items.length} reviews + smart replies ready for ${restaurantName}`
      : `📬 ${items.length} new reviews + smart replies for ${restaurantName}`;

    const { data, error } = await resend.emails.send({
      from: "Revuly <notifications@revuly.dev>",
      to,
      subject,
      html: buildDigestHtml({ restaurantName, items, isInitialSync }),
    });

    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Internal helper — callable from other server routes without going through HTTP.
export async function sendDigestEmail({ to, restaurantName, items, isInitialSync }) {
  if (!to || !Array.isArray(items) || items.length === 0) return { error: "no recipients/items" };

  const subject = isInitialSync
    ? `🎉 Welcome — ${items.length} reviews + smart replies ready for ${restaurantName}`
    : `📬 ${items.length} new reviews + smart replies for ${restaurantName}`;

  return resend.emails.send({
    from: "Revuly <notifications@revuly.dev>",
    to,
    subject,
    html: buildDigestHtml({ restaurantName, items, isInitialSync }),
  });
}
