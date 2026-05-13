import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, name } = await req.json();
    if (!email) return Response.json({ error: "Missing email" }, { status: 400 });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
      <div style="width:32px;height:32px;background:linear-gradient(135deg,#8a6e2f,#c9a84c);border-radius:8px;text-align:center;line-height:32px;font-size:16px">✦</div>
      <span style="font-size:20px;font-weight:700;color:#e8c96a;font-family:Georgia,serif">Revuly</span>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#f0ede6;margin:0 0 10px">Welcome to Revuly! 🎉</h1>
    <p style="font-size:14px;color:#a09888;margin:0 0 28px;line-height:1.7">
      You're all set, ${name || "there"}. Your 14-day free trial has begun — here's how to get the most out of Revuly in the next few minutes.
    </p>
    <div style="background:#1c1c22;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:28px">
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06)">
        <div style="display:flex;gap:14px;align-items:flex-start">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8a6e2f,#c9a84c);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#000;flex-shrink:0;text-align:center;line-height:32px">1</div>
          <div><div style="font-size:15px;font-weight:700;color:#f0ede6;margin-bottom:4px">Add Your First Review</div><div style="font-size:13.5px;color:#a09888;line-height:1.6">In your dashboard, click "Add Review" and paste a real customer review. Your AI replies will be generated instantly.</div></div>
        </div>
      </div>
      <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06)">
        <div style="display:flex;gap:14px;align-items:flex-start">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8a6e2f,#c9a84c);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#000;flex-shrink:0;text-align:center;line-height:32px">2</div>
          <div><div style="font-size:15px;font-weight:700;color:#f0ede6;margin-bottom:4px">Connect Google Business</div><div style="font-size:13.5px;color:#a09888;line-height:1.6">Link your verified Google Business Profile for automatic review sync and instant email notifications.</div></div>
        </div>
      </div>
      <div>
        <div style="display:flex;gap:14px;align-items:flex-start">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#8a6e2f,#c9a84c);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#000;flex-shrink:0;text-align:center;line-height:32px">3</div>
          <div><div style="font-size:15px;font-weight:700;color:#f0ede6;margin-bottom:4px">Explore Keyword Intelligence</div><div style="font-size:13.5px;color:#a09888;line-height:1.6">After adding a few reviews, see which topics guests mention most — and whether they're positive or negative.</div></div>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:32px">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c96a,#c9a84c);color:#000;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none">Go to Dashboard →</a>
    </div>
    <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px 20px;margin-bottom:28px">
      <p style="font-size:13px;color:#a09888;margin:0;line-height:1.65">Questions? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help" style="color:#c9a84c;text-decoration:none">Help Centre</a>. We typically respond within 24 hours.</p>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;text-align:center">
      <p style="font-size:12px;color:#5a5550;margin:0">Revuly · AI-Powered Reputation Management · <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#5a5550;text-decoration:none">Privacy</a></p>
    </div>
  </div>
</body></html>`;

    const { error } = await resend.emails.send({
      from: "Revuly <welcome@revuly.dev>",
      to: email,
      subject: "Welcome to Revuly! You're all set 🎉",
      html,
    });

    if (error) return Response.json({ error }, { status: 400 });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
