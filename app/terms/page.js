"use client";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@300;400;500;600&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:0 6vw;height:64px;border-bottom:1px solid rgba(255,255,255,0.06);background:var(--bg)}
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

export default function TermsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="terms" />
      <nav className="nav">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
        <a className="nav-back" href="/">← Back to Home</a>
      </nav>
      <div className="wrap">
        <h1>Terms of Service</h1>
        <p className="meta">Effective Date: January 1, 2026 &nbsp;|&nbsp; Last Updated: May 1, 2026</p>

        <div className="highlight">
          <p>Please read these Terms carefully before using Revuly. By accessing or using our platform, you agree to be bound by these Terms.</p>
        </div>

        <h2>1. Acceptance of Terms</h2>
        <p>These Terms of Service ("Terms") govern your access to and use of Revuly ("Service"), operated by Revuly Inc. ("Company", "we", "us", or "our"). By creating an account or using the Service, you agree to these Terms and our Privacy Policy.</p>

        <h2>2. Description of Service</h2>
        <p>Revuly is a Google Business review management platform that enables restaurant owners and hospitality professionals to monitor, analyse, and respond to customer reviews using intelligent automation. The Service includes AI-generated reply suggestions, sentiment analysis, keyword intelligence, and email notifications.</p>

        <h2>3. Google API Usage</h2>
        <p>Revuly integrates with Google Business Profile API to retrieve review data on your behalf. By connecting your Google Business account, you:</p>
        <ul>
          <li>Authorise Revuly to access, read, and display your Google Business reviews</li>
          <li>Acknowledge that Revuly's use of Google data is subject to Google's Terms of Service and API policies</li>
          <li>Understand that Revuly does not post replies to Google on your behalf without your explicit action</li>
          <li>Agree to maintain a valid and verified Google Business Profile</li>
        </ul>
        <p>Revuly's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>

        <h2>4. Subscription Plans & Billing</h2>
        <p>Revuly offers the following subscription plans:</p>
        <ul>
          <li><strong>Free Trial:</strong> 14-day trial with 5 smart reply credits. No credit card required.</li>
          <li><strong>Starter:</strong> $39/month — 30 smart replies, 1 location, manual input.</li>
          <li><strong>Growth:</strong> $99/month — 150 smart replies, 1 location, auto-sync, full features.</li>
          <li><strong>Pro:</strong> $199/month — Unlimited replies, 1 location (contact us for multi-location), AI style learning, priority support.</li>
        </ul>
        <p>All prices are in USD. Subscriptions renew automatically on a monthly basis. You may cancel at any time from your account settings, effective at the end of the current billing period.</p>

        <h2>5. Refund Policy</h2>
        <p>We offer a 7-day money-back guarantee for first-time subscribers. If you are not satisfied within 7 days of your first paid subscription, contact us at <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a> for a full refund. Subsequent subscription periods are non-refundable except where required by applicable law.</p>

        <h2>6. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to generate misleading, fraudulent, or defamatory review responses</li>
          <li>Attempt to manipulate Google's review system in violation of Google's policies</li>
          <li>Share your account credentials with third parties</li>
          <li>Reverse-engineer, scrape, or misuse the Revuly platform or API</li>
          <li>Upload or transmit any malicious code or content</li>
        </ul>

        <h2>7. AI-Generated Content</h2>
        <p>Revuly uses our intelligent suggestion engine to generate reply suggestions. You acknowledge that:</p>
        <ul>
          <li>AI-generated replies are suggestions only — you are responsible for reviewing before publishing</li>
          <li>Revuly does not guarantee the accuracy, appropriateness, or legal compliance of AI output</li>
          <li>You retain full responsibility for any content you publish to Google Business</li>
        </ul>

        <h2>8. Data Ownership & Privacy</h2>
        <p>You retain ownership of all review data and content associated with your account. Revuly collects and processes data in accordance with our Privacy Policy. We do not sell your data to third parties.</p>

        <h2>9. Intellectual Property</h2>
        <p>The Revuly platform, including its design, features, and brand, is the exclusive property of Revuly Inc. You are granted a limited, non-exclusive, non-transferable licence to use the Service during your subscription period.</p>

        <h2>10. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Revuly's liability for any claim arising from your use of the Service shall not exceed the amount you paid in the 3 months preceding the claim. Revuly is not liable for indirect, consequential, or incidental damages.</p>

        <h2>11. Termination</h2>
        <p>We reserve the right to suspend or terminate your account for violations of these Terms. You may delete your account at any time from the dashboard settings. Upon termination, your data will be deleted within 30 days.</p>

        <h2>12. Governing Law</h2>
        <p>These Terms are governed by the laws of the State of Delaware, United States. Any disputes shall be resolved through binding arbitration in accordance with the AAA Commercial Arbitration Rules.</p>

        <h2>13. Changes to Terms</h2>
        <p>We may update these Terms from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance.</p>

        <h2>14. Contact</h2>
        <p>For questions about these Terms, please contact us at <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a> or visit our <a href="/help">Help Centre</a>.</p>
      </div>
    </>
  );
}
