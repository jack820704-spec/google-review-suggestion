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
  table{width:100%;border-collapse:collapse;margin:16px 0}
  th,td{padding:10px 14px;text-align:left;font-size:13.5px;border-bottom:1px solid rgba(255,255,255,0.06)}
  th{color:var(--text1);font-weight:600}
  td{color:var(--text2)}
`;

export default function PrivacyPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="privacy" />
      <nav className="nav">
        <a className="logo" href="/"><span className="logo-icon">✦</span>Revuly</a>
        <a className="nav-back" href="/">← Back to Home</a>
      </nav>
      <div className="wrap">
        <h1>Privacy Policy</h1>
        <p className="meta">Effective Date: January 1, 2026 &nbsp;|&nbsp; Last Updated: May 1, 2026</p>

        <div className="highlight">
          <p>Revuly is committed to protecting your privacy. This Policy explains what data we collect, how we use it, and your rights — including compliance with GDPR and Google OAuth requirements.</p>
        </div>

        <h2>1. Who We Are</h2>
        <p>Revuly Inc. operates the Revuly platform at <a href="https://revuly.dev">revuly.dev</a>. We are the data controller for personal data collected through the Service. Contact us at <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a>.</p>

        <h2>2. Data We Collect</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Data Points</th><th>Source</th></tr>
          </thead>
          <tbody>
            <tr><td>Account</td><td>Email address, name, password (hashed)</td><td>Registration form</td></tr>
            <tr><td>Restaurant</td><td>Restaurant name, type, city, country</td><td>Onboarding form</td></tr>
            <tr><td>Google Business</td><td>Google account ID, Business Profile ID, review data, OAuth tokens</td><td>Google OAuth</td></tr>
            <tr><td>Usage</td><td>Reply count, login timestamps, subscription plan</td><td>Automated</td></tr>
            <tr><td>Communications</td><td>Email notification preferences</td><td>Settings form</td></tr>
          </tbody>
        </table>

        <h2>3. Google Data — Limited Use Disclosure</h2>
        <p>Revuly's use of information received from Google APIs is limited to the following, in compliance with the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank">Google API Services User Data Policy</a>:</p>
        <ul>
          <li><strong>Reading reviews:</strong> We access your Google Business Profile reviews solely to display them within your Revuly dashboard and generate AI reply suggestions.</li>
          <li><strong>No data sharing:</strong> Google review data is not shared with, sold to, or used by any third party for advertising or other purposes.</li>
          <li><strong>No autonomous posting:</strong> Revuly never posts replies to Google on your behalf without your explicit manual action.</li>
          <li><strong>Token storage:</strong> OAuth access and refresh tokens are stored encrypted and used only to fetch review data on your behalf.</li>
          <li><strong>Data deletion:</strong> Upon account deletion, all Google OAuth tokens and associated review data are permanently deleted within 30 days.</li>
        </ul>

        <h2>4. How We Use Your Data</h2>
        <ul>
          <li>To provide, maintain, and improve the Revuly platform</li>
          <li>To generate AI reply suggestions using Anthropic Claude</li>
          <li>To send email notifications about new reviews (with your consent)</li>
          <li>To send weekly reports (Growth/Pro plans, with your consent)</li>
          <li>To process subscription billing via our payment processor</li>
          <li>To prevent fraud and enforce our Terms of Service</li>
        </ul>

        <h2>5. Legal Basis for Processing (GDPR)</h2>
        <p>For users in the European Economic Area, we process your data under the following legal bases:</p>
        <ul>
          <li><strong>Contract performance:</strong> Processing necessary to provide the Service you subscribed to</li>
          <li><strong>Legitimate interests:</strong> Security, fraud prevention, service improvement</li>
          <li><strong>Consent:</strong> Email notifications and marketing communications (you may withdraw consent at any time)</li>
        </ul>

        <h2>6. Data Sharing & Third Parties</h2>
        <p>We do not sell your personal data. We share data only with:</p>
        <ul>
          <li><strong>Supabase</strong> — Database and authentication infrastructure (data stored in EU region)</li>
          <li><strong>Anthropic</strong> — Review text is sent to Claude API to generate reply suggestions (not retained by Anthropic for training)</li>
          <li><strong>Resend</strong> — Email delivery service for notifications and reports</li>
          <li><strong>Vercel</strong> — Hosting and deployment platform</li>
        </ul>

        <h2>7. Data Retention</h2>
        <p>We retain your data for as long as your account is active. If you delete your account:</p>
        <ul>
          <li>Account and profile data: deleted within 30 days</li>
          <li>Review data: deleted within 30 days</li>
          <li>Google OAuth tokens: immediately revoked and deleted</li>
          <li>Billing records: retained for 7 years as required by law</li>
        </ul>

        <h2>8. Your Rights (GDPR)</h2>
        <p>If you are located in the EEA, you have the following rights:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Correct inaccurate data</li>
          <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
          <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
          <li><strong>Restriction:</strong> Request we limit processing of your data</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Withdraw consent:</strong> Withdraw marketing consent at any time</li>
        </ul>
        <p>To exercise these rights, email <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a>. We will respond within 30 days.</p>

        <h2>9. Cookies</h2>
        <p>Revuly uses essential session cookies for authentication only. We do not use advertising or tracking cookies. You can clear cookies through your browser settings; this will log you out of the Service.</p>

        <h2>10. Security</h2>
        <p>We implement industry-standard security measures including TLS encryption in transit, AES-256 encryption at rest for OAuth tokens, and role-based access controls. We conduct regular security reviews.</p>

        <h2>11. International Transfers</h2>
        <p>Data may be transferred to and processed in the United States. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where required by GDPR.</p>

        <h2>12. Children's Privacy</h2>
        <p>The Service is not directed to individuals under 16. We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us immediately.</p>

        <h2>13. Changes to This Policy</h2>
        <p>We will notify you of material changes to this Privacy Policy via email and in-app notice at least 14 days before changes take effect.</p>

        <h2>14. Contact & Supervisory Authority</h2>
        <p>Questions? Contact our privacy team at <a href="mailto:revuly.support@gmail.com">revuly.support@gmail.com</a>. If you are in the EEA and believe we have not adequately addressed your concern, you have the right to lodge a complaint with your local data protection authority.</p>
      </div>
    </>
  );
}
