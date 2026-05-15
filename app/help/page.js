"use client";
import { useState } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--bg:#0a0a0b;--bg2:#111114;--surface:#1c1c22;--gold:#c9a84c;--gold-lt:#e8c96a;--gold-dim:#8a6e2f;--gold-border:rgba(201,168,76,0.22);--text1:#f0ede6;--text2:#a09888;--text3:#5a5550;--r:10px;--pos:#5dba7a}
  body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text1);-webkit-font-smoothing:antialiased}
  .topbar{height:58px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:var(--bg);position:sticky;top:0;z-index:10}
  .logo{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--gold-lt);display:flex;align-items:center;gap:8px;text-decoration:none}
  .logo-icon{width:26px;height:26px;background:linear-gradient(135deg,var(--gold-dim),var(--gold));border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px}
  .layout{display:grid;grid-template-columns:220px 1fr;max-width:1100px;margin:0 auto;min-height:calc(100vh - 58px)}
  @media(max-width:700px){.layout{grid-template-columns:1fr}}
  .sidebar{padding:24px 16px;border-right:1px solid rgba(255,255,255,.06);position:sticky;top:58px;height:calc(100vh - 58px);overflow-y:auto}
  @media(max-width:700px){.sidebar{display:none}}
  .sidebar-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin:16px 0 8px;padding-left:10px}
  .sidebar-link{display:block;padding:8px 10px;border-radius:8px;font-size:13.5px;color:var(--text2);text-decoration:none;transition:all .18s;margin-bottom:2px;cursor:pointer;border:none;background:transparent;font-family:inherit;width:100%;text-align:left}
  .sidebar-link:hover,.sidebar-link.active{background:var(--surface);color:var(--text1)}
  .sidebar-link.active{color:var(--gold-lt);font-weight:600}
  .content{padding:40px 48px 80px}
  @media(max-width:700px){.content{padding:24px 6vw 60px}}
  .section{margin-bottom:56px}
  .section-anchor{position:relative;top:-80px}
  h2{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;margin-bottom:10px}
  .section-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:rgba(201,168,76,.08);border:1px solid var(--gold-border);font-size:11px;font-weight:700;color:var(--gold);letter-spacing:.6px;text-transform:uppercase;margin-bottom:14px}
  p{font-size:14.5px;color:var(--text2);line-height:1.8;margin-bottom:14px}
  h3{font-size:16px;font-weight:700;color:var(--text1);margin:24px 0 10px}
  ol,ul{padding-left:20px;margin-bottom:14px}
  li{font-size:14.5px;color:var(--text2);line-height:1.8;margin-bottom:4px}
  a{color:var(--gold);text-decoration:none}
  a:hover{text-decoration:underline}
  .step-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r);padding:18px 20px;margin-bottom:12px;display:flex;gap:16px;align-items:flex-start}
  .step-n{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--gold));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#000;flex-shrink:0}
  .step-body h4{font-size:14px;font-weight:700;margin-bottom:4px}
  .step-body p{margin:0;font-size:13.5px}
  .faq-item{border-bottom:1px solid rgba(255,255,255,.07)}
  .faq-item:first-child{border-top:1px solid rgba(255,255,255,.07)}
  .faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;padding:18px 0;background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;font-size:14.5px;font-weight:600;color:var(--text1);transition:color .2s;gap:16px}
  .faq-q:hover{color:var(--gold-lt)}
  .faq-icon{width:24px;height:24px;flex-shrink:0;border-radius:50%;border:1px solid var(--gold-border);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--gold);transition:transform .25s}
  .faq-icon.open{transform:rotate(45deg)}
  .faq-a{max-height:0;overflow:hidden;transition:max-height .35s cubic-bezier(0.4,0,0.2,1),padding .35s;font-size:14px;color:var(--text2);line-height:1.75}
  .faq-a.open{max-height:300px;padding-bottom:16px}
  .contact-card{background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(201,168,76,.03));border:1px solid var(--gold-border);border-radius:var(--r);padding:28px}
  .contact-card h3{margin-top:0;margin-bottom:8px;color:var(--text1)}
  .contact-email{font-size:18px;color:var(--gold-lt);font-weight:700;margin-bottom:12px}
  .contact-note{font-size:13px;color:var(--text2)}
  .highlight-box{background:rgba(93,186,122,.06);border:1px solid rgba(93,186,122,.2);border-radius:var(--r);padding:14px 18px;margin-bottom:16px}
  .highlight-box p{color:var(--pos);margin:0;font-size:13.5px}
`;

const NAV = [
  { id:"getting-started", label:"Getting Started" },
  { id:"connect-google", label:"Connect Google Business" },
  { id:"ai-reply", label:"Using AI Reply" },
  { id:"keyword-intel", label:"Keyword Intelligence" },
  { id:"notifications", label:"Email Notifications" },
  { id:"faq", label:"FAQ" },
  { id:"contact", label:"Contact Support" },
];

const FAQS = [
  { q:"Can I try Revuly without a Google Business account?", a:"Absolutely. During your free trial, you can manually add review text directly into the dashboard. The AI reply generation works for any review you add, regardless of Google connection." },
  { q:"What if I have multiple Google Business locations?", a:"Growth and Pro plans support multiple locations. Each location is managed as a separate property within your account. Enterprise clients can also assign team members to specific venues." },
  { q:"How many AI replies does each plan include?", a:"Free Trial includes 5 replies to explore the platform. Starter gives you 30/month. Growth gives you 150/month. Pro is unlimited — no caps, ever." },
  { q:"Can the AI reply in my restaurant's specific style?", a:"Pro subscribers benefit from adaptive AI that learns from your past replies and brand guidelines you provide. Over time, the AI begins to sound more and more like you specifically." },
  { q:"Why can't I see my Google Business account after connecting?", a:"Ensure you're signing in with the Google account that owns or manages your Google Business Profile. If your profile is still pending verification, you won't be able to access review data until verification is complete." },
  { q:"Are my reviews and data private?", a:"Yes. Your review data is private and is never shared with or sold to third parties. Review text is sent to Anthropic's Claude API solely to generate reply suggestions, and Anthropic does not use this data for training." },
  { q:"Can I cancel my subscription at any time?", a:"Yes. Cancel anytime from your dashboard settings. Your access continues until the end of the current billing period. No cancellation fees." },
  { q:"What languages can Revuly reply in?", a:"Currently: English, Traditional Chinese, Simplified Chinese, Vietnamese, French, Spanish, and Japanese. Select your preferred reply language in the AI editor on the right-hand panel of the dashboard." },
  { q:"How do I actually post the AI reply to Google?", a:"Revuly doesn't post directly to Google on your behalf (this is by design — you stay in control). Copy the reply you like, then paste it directly into your Google Business Profile manager on business.google.com." },
  { q:"What counts as a 'crisis' alert?", a:"A crisis is automatically detected when 3 or more reviews with a rating of 2 stars or below appear within any 24-hour period. You'll receive an immediate email alert with a red 'Crisis' banner and AI reply suggestions." },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeSection, setActiveSection] = useState("getting-started");

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} precedence="default" href="help" />
      <div className="topbar">
        <a className="logo" href="/dashboard"><span className="logo-icon">✦</span>Revuly Help Centre</a>
        <div style={{display:"flex",gap:10}}>
          <a href="/dashboard" style={{padding:"6px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"var(--text2)",cursor:"pointer",fontFamily:"inherit",fontSize:13,textDecoration:"none"}}>← Dashboard</a>
        </div>
      </div>

      <div className="layout">
        {/* SIDEBAR */}
        <nav className="sidebar">
          <div className="sidebar-label">Help Topics</div>
          {NAV.map((n) => (
            <button key={n.id} className={`sidebar-link${activeSection===n.id?" active":""}`} onClick={() => scrollTo(n.id)}>{n.label}</button>
          ))}
        </nav>

        {/* CONTENT */}
        <div className="content">

          {/* GETTING STARTED */}
          <div className="section">
            <div id="getting-started" className="section-anchor" />
            <div className="section-badge">01</div>
            <h2>Getting Started</h2>
            <p>Welcome to Revuly! Here's how to go from sign-up to your first AI-generated reply in under 5 minutes.</p>
            <div className="step-card"><div className="step-n">1</div><div className="step-body"><h4>Complete Onboarding</h4><p>Enter your restaurant name, type, city, and country. This context is used by the AI to write replies that sound genuinely from you.</p></div></div>
            <div className="step-card"><div className="step-n">2</div><div className="step-body"><h4>Connect Google Business (or skip)</h4><p>Connect your verified Google Business Profile for automatic review sync. If you're on the trial, you can skip this and add reviews manually.</p></div></div>
            <div className="step-card"><div className="step-n">3</div><div className="step-body"><h4>Add a Review</h4><p>On the dashboard, click "Add Review" to manually paste a customer review. On Growth/Pro, reviews sync automatically.</p></div></div>
            <div className="step-card"><div className="step-n">4</div><div className="step-body"><h4>Generate AI Replies</h4><p>Click on any review, select your preferred reply style (Warm & Personal, Professional & Gracious, or Brief & Direct), and click "Generate AI Replies".</p></div></div>
            <div className="step-card"><div className="step-n">5</div><div className="step-body"><h4>Copy & Post to Google</h4><p>Choose the reply you like best, click "Copy", then paste it into your Google Business Profile manager. Click "Mark Replied" in Revuly to track your response rate.</p></div></div>
          </div>

          {/* CONNECT GOOGLE */}
          <div className="section">
            <div id="connect-google" className="section-anchor" />
            <div className="section-badge">02</div>
            <h2>How to Connect Google Business</h2>
            <p>Connecting your Google Business Profile allows Revuly to automatically fetch new reviews and notify you instantly. Here's how:</p>
            <h3>Before You Start</h3>
            <ol>
              <li>You need a Google account that owns or manages a <strong>verified</strong> Google Business Profile</li>
              <li>If you don't have one, go to <a href="https://business.google.com" target="_blank">business.google.com</a> and click "Manage now"</li>
              <li>Business verification typically takes 1–2 weeks via postcard, phone, or video verification</li>
              <li>Once verified, return to Revuly and connect your account</li>
            </ol>
            <h3>Connection Steps</h3>
            <ol>
              <li>In Revuly, go to <strong>Settings → Google Business Connection</strong></li>
              <li>Click <strong>"Connect Google Business Account"</strong></li>
              <li>Sign in with the Google account that owns your Business Profile</li>
              <li>Review the permissions and click <strong>Allow</strong> — Revuly only reads review data, it never posts on your behalf</li>
              <li>Select the correct business location if you have multiple</li>
            </ol>
            <h3>Common Issues</h3>
            <p><strong>I can't see my business after connecting.</strong> Make sure you're logged into the correct Google account. Your business must be fully verified — pending businesses won't appear.</p>
            <p><strong>I get an authorisation error.</strong> Try disconnecting and reconnecting. If the issue persists, contact support@revuly.dev.</p>
            <p><strong>I have multiple locations.</strong> After connecting, each location can be added separately under Settings. Growth/Pro plans support up to 5 and unlimited locations respectively.</p>
          </div>

          {/* AI REPLY */}
          <div className="section">
            <div id="ai-reply" className="section-anchor" />
            <div className="section-badge">03</div>
            <h2>Using AI Reply</h2>
            <p>Revuly uses Anthropic's Claude AI to generate contextually relevant, genuine-sounding replies that match your restaurant's voice.</p>
            <h3>Step-by-Step</h3>
            <ol>
              <li>Click any review in the middle panel of your dashboard</li>
              <li>The review appears in the right-hand AI Editor panel</li>
              <li>Select a <strong>Reply Style</strong>: Warm & Personal, Professional & Gracious, or Brief & Direct</li>
              <li>Select your preferred <strong>Language</strong> (English, 繁中, Tiếng Việt, etc.)</li>
              <li>Click <strong>"Generate AI Replies"</strong></li>
              <li>All three styles are generated simultaneously</li>
              <li>Review, edit if needed, then click <strong>"Copy"</strong></li>
              <li>Paste your reply into your Google Business Profile manager</li>
              <li>Click <strong>"Mark Replied"</strong> in Revuly to update your response rate</li>
            </ol>
            <div className="highlight-box"><p>✓ Tip: The AI reads the specific content of the review. The more detailed the review, the more personalised and effective the reply.</p></div>
            <h3>Reply Styles Explained</h3>
            <p><strong>Warm & Personal</strong> — Written as if you, the owner, personally read this review tonight after closing. Casual, genuine, and specific to what the guest mentioned.</p>
            <p><strong>Professional & Gracious</strong> — A more polished response representing your brand. Elegant, refined, and confident. Ideal for fine dining establishments.</p>
            <p><strong>Brief & Direct</strong> — 2–3 sentences. Punchy and impactful. Great for positive reviews or when you want to acknowledge without over-explaining.</p>
          </div>

          {/* KEYWORD INTELLIGENCE */}
          <div className="section">
            <div id="keyword-intel" className="section-anchor" />
            <div className="section-badge">04</div>
            <h2>Keyword Intelligence</h2>
            <p>Revuly automatically scans all your reviews and categorises mentions into key topics — giving you an at-a-glance understanding of what guests talk about most.</p>
            <h3>Default Categories</h3>
            <ul>
              <li><strong>Food Quality</strong> — General food mentions: delicious, fresh, bland, overcooked, etc.</li>
              <li><strong>Seafood / Meat</strong> — Specific protein-related feedback</li>
              <li><strong>Service</strong> — Staff and service-related terms</li>
              <li><strong>Ambiance</strong> — Atmosphere, decor, noise level</li>
              <li><strong>Value</strong> — Price-to-quality perception</li>
              <li><strong>Speed</strong> — Wait times and pacing</li>
              <li><strong>Crisis</strong> — Severe negative terms that indicate serious issues</li>
            </ul>
            <p>Each category shows a positive/negative split bar and mention count. Click any category to filter the review list to only those reviews containing those keywords.</p>
            <h3>Custom Keywords (Growth & Pro)</h3>
            <p>Add your own keywords — like specific dishes, your chef's name, or brand-specific terms — in <strong>Settings → Custom Keywords</strong>. These appear as additional categories in your Keyword Intelligence panel.</p>
          </div>

          {/* NOTIFICATIONS */}
          <div className="section">
            <div id="notifications" className="section-anchor" />
            <div className="section-badge">05</div>
            <h2>Email Notifications</h2>
            <p>Revuly sends beautifully formatted emails whenever you receive a new review, including the review content and pre-generated AI reply suggestions — so you can respond even before opening the dashboard.</p>
            <h3>Setting Up Notifications</h3>
            <p>Go to <strong>Settings → Email Notifications</strong> and toggle on "Email Notifications". Choose your preferred frequency: Immediately, Daily Digest, or Weekly Only.</p>
            <h3>What the Email Contains</h3>
            <ul>
              <li>Reviewer name, star rating, and date</li>
              <li>Full review content in a quoted style</li>
              <li>Three AI-generated reply suggestions (all three styles)</li>
              <li>A "View in Dashboard" link for direct access</li>
            </ul>
            <h3>Crisis Alert Emails</h3>
            <p>When crisis mode triggers (3+ low-rating reviews in 24 hours), you receive an immediate email with a red alert banner — regardless of your frequency setting. This ensures you never miss an urgent situation.</p>
            <h3>Weekly Reports (Growth & Pro)</h3>
            <p>Enable weekly reports in Settings to receive a Monday morning summary including: total reviews, average rating vs previous week, top 5 keywords, reply rate, and number of unanswered reviews.</p>
          </div>

          {/* FAQ */}
          <div className="section">
            <div id="faq" className="section-anchor" />
            <div className="section-badge">06</div>
            <h2>Frequently Asked Questions</h2>
            <div>
              {FAQS.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button className="faq-q" onClick={() => setOpenFaq(openFaq===i?null:i)}>{faq.q}<span className={`faq-icon${openFaq===i?" open":""}`}>+</span></button>
                  <div className={`faq-a${openFaq===i?" open":""}`}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CONTACT */}
          <div className="section">
            <div id="contact" className="section-anchor" />
            <div className="section-badge">07</div>
            <h2>Contact Support</h2>
            <div className="contact-card">
              <h3>We're here to help</h3>
              <div className="contact-email"><a href="mailto:support@revuly.dev">support@revuly.dev</a></div>
              <p className="contact-note">Our team typically responds within 24 hours on business days (Mon–Fri, 9am–6pm EST). Pro plan subscribers receive priority support with a 4-hour response time guarantee.</p>
              <p className="contact-note" style={{marginBottom:0}}>For urgent issues — system outages or billing errors — please include "URGENT" in your email subject line.</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
