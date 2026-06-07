"use client";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:0 6vw;height:64px;border-bottom:1px solid rgba(255,255,255,0.06)}
  .logo{font-family:'Playfair Display',serif;font-size:20px;color:var(--gold-lt);text-decoration:none;display:flex;align-items:center;gap:8px}
  .logo-icon{width:28px;height:28px;background:linear-gradient(135deg,#8a6e2f,var(--gold));border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px}
  .nav-back{font-size:13px;color:var(--text2);text-decoration:none;border:1px solid var(--gold-border);padding:6px 14px;border-radius:8px;transition:color .2s}
  .nav-back:hover{color:var(--gold-lt)}
  .wrap{max-width:780px;margin:0 auto;padding:64px 6vw 100px}
  h1{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,40px);margin-bottom:8px}
  .meta{font-size:13px;color:var(--text3);margin-bottom:48px}
  h2{font-size:18px;font-weight:700;color:var(--text1);margin:36px 0 12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)}
  p{font-size:14.5px;line-height:1.8;color:var(--text2);margin-bottom:14px}
  ul{padding-left:20px;margin-bottom:14px}
  li{font-size:14.5px;line-height:1.8;color:var(--text2);margin-bottom:4px}
  a{color:var(--gold);text-decoration:none}
  a:hover{text-decoration:underline}
  .highlight{background:rgba(201,168,76,0.08);border:1px solid var(--gold-border);border-radius:var(--r);padding:16px 20px;margin:20px 0}
  .highlight p{margin:0;color:var(--text1)}
`;

export default function RefundPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="refund" />
      <nav className="nav">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
        <a className="nav-back" href="/">← Back to Home</a>
      </nav>
      <div className="wrap">
        <h1>Refund Policy</h1>
        <p className="meta">Effective Date: January 1, 2026 &nbsp;|&nbsp; Last Updated: June 6, 2026</p>

        <div className="highlight">
          <p>We want you to be confident in Revuly. Start with a 14-day free trial, and if a paid plan isn't right for you, we offer a straightforward 7-day refund window. This Policy explains how it works.</p>
        </div>

        <h2>1. 14-Day Free Trial</h2>
        <p>Every new account starts with a 14-day free trial. During this period you have full access to your plan's features at no cost. You can cancel at any time before the trial ends and you will never be charged. No payment is taken until the trial period concludes.</p>

        <h2>2. 7-Day Refund Window</h2>
        <p>If you are charged after your free trial and run into a problem or are not satisfied, you may request a refund within 7 days of the charge. Simply email <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a> with your account email and the reason for your request, and our team will process eligible refunds back to your original payment method.</p>

        <h2>3. Cancellation & Service Period</h2>
        <p>You can cancel your subscription at any time from your account settings. When you cancel, your subscription will not renew, but your service remains active until the end of the current billing period that you have already paid for. You keep full access until that period ends.</p>

        <h2>4. How to Request a Refund</h2>
        <ul>
          <li>Email <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a> within 7 days of the charge.</li>
          <li>Include the email address associated with your Revuly account.</li>
          <li>Briefly describe the issue or reason for your request.</li>
          <li>We will review and respond, typically within 2 business days. Approved refunds are returned to your original payment method.</li>
        </ul>

        <h2>5. Contact Us</h2>
        <p>Questions about billing or refunds? We're happy to help. Reach our support team at <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a> and we'll get back to you as soon as possible.</p>
      </div>
    </>
  );
}
