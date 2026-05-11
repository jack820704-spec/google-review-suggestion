import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function starsHtml(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function buildEmail({ restaurantName, review, replies, isCrisis }) {
  const crisisBanner = isCrisis ? `
    <div style="background:#7f1d1d;border-radius:8px;padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">🚨</span>
      <div>
        <div style="font-weight:700;font-size:15px;color:#fca5a5">Crisis Alert</div>
        <div style="font-size:13px;color:#fca5a5;opacity:.8">This restaurant has received multiple low-rating reviews recently. Immediate attention recommended.</div>
      </div>
    </div>` : "";

  const repliesHtml = Object.entries(replies || {}).map(([style, text]) => {
    const styleNames = { warm: "Warm & Personal", professional: "Professional & Gracious", brief: "Brief & Direct" };
    return `
      <div style="margin-bottom:20px;padding:16px;background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c9a84c;margin-bottom:10px">${styleNames[style] || style}</div>
        <div style="font-size:14px;line-height:1.7;color:#a09888">${text}</div>
      </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <!-- HEADER -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8a6e2f,#c9a84c);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;text-align:center;line-height:32px">✦</div>
      <span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">Revuly</span>
    </div>

    ${crisisBanner}

    <!-- SUBJECT LINE -->
    <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#f0ede6;margin:0 0 6px">
      ${isCrisis ? "🚨" : "⭐"} New Review — ${restaurantName}
    </h1>
    <p style="font-size:13px;color:#5a5550;margin:0 0 28px">${new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</p>

    <!-- REVIEW CARD -->
    <div style="background:#1c1c22;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:28px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#8a6e2f,#222229);display:flex;align-items:center;justify-content:center;font-weight:700;color:#e8c96a;font-size:15px;font-family:Georgia,serif;text-align:center;line-height:36px">
          ${(review.reviewer_name || "?")[0].toUpperCase()}
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#f0ede6">${review.reviewer_name || "Anonymous"}</div>
          <div style="font-size:13px;color:#c9a84c">${starsHtml(review.rating)} · ${new Date(review.review_date || Date.now()).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
        </div>
      </div>
      <div style="padding:14px;background:rgba(255,255,255,0.03);border-left:3px solid rgba(201,168,76,0.4);border-radius:0 6px 6px 0">
        <p style="font-size:14px;line-height:1.75;color:#a09888;margin:0;font-style:italic">"${review.content}"</p>
      </div>
    </div>

    <!-- AI REPLIES -->
    <div style="margin-bottom:28px">
      <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5a5550;margin-bottom:16px">💬 AI Suggested Replies</div>
      ${repliesHtml}
      <p style="font-size:12px;color:#5a5550;margin-top:8px">Select the reply that best fits your voice, copy it, and paste into your Google Business Profile manager.</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;letter-spacing:0.3px">View in Dashboard →</a>
    </div>

    <!-- FOOTER -->
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center">
      <p style="font-size:12px;color:#5a5550;margin:0 0 8px">Revuly · AI-Powered Reputation Management</p>
      <p style="font-size:12px;color:#5a5550;margin:0">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#5a5550;text-decoration:none">Manage notifications</a> ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color:#5a5550;text-decoration:none">Terms</a> ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#5a5550;text-decoration:none">Privacy</a>
      </p>
    </div>
  </div>
</body></html>`;
}

export async function POST(req) {
  try {
    const { to, restaurantName, review, replies, isCrisis } = await req.json();
    if (!to || !review) return Response.json({ error: "Missing required fields" }, { status: 400 });

    const subject = isCrisis
      ? `🚨 Crisis Alert — New ${review.rating}★ review at ${restaurantName}`
      : `⭐ New ${review.rating}★ review at ${restaurantName}`;

    const { data, error } = await resend.emails.send({
      from: "Revuly <notifications@revuly.com>",
      to,
      subject,
      html: buildEmail({ restaurantName, review, replies, isCrisis }),
    });

    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ success: true, id: data?.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
