"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TEXT = {
  en: {
    tag: "Google Review Reply System",
    pill: "Free trial 3 times｜Built for businesses",
    title: "Turn every review reply into customer trust",
    subtitle:
      "Paste a customer review and instantly generate three reply styles: Professional, Premium Brand, and Crisis Handling. Help your business respond better to positive, neutral, and negative reviews.",
    f1: "Professional",
    f1d: "Natural and polite replies for everyday customer reviews.",
    f2: "Premium Brand",
    f2d: "Refined replies for beauty, medical aesthetics, restaurants, and premium brands.",
    f3: "Crisis Handling",
    f3d: "Calm and careful replies for negative reviews and sensitive situations.",
    f4: "Save Time",
    f4d: "No need to struggle with wording. Generate three ready-to-use versions instantly.",
    cta: "Start your free trial and experience the difference.",
    start: "Start Free Trial",
    authDesc: "Create an account and get 3 free reply generations.",
    login: "Login",
    register: "Free Register",
    authNote: "No credit card required. Each generation provides three reply styles.",
    logout: "Logout",
    heroPill: "Generate three reply styles",
    heroSubtitle:
      "Paste a customer review and receive three public-ready responses from different angles: Professional, Premium Brand, and Crisis Handling.",
    account: "Account",
    remaining: "Free trial remaining",
    reviewTitle: "Paste Customer Review",
    placeholder: "Example: The service was good, but the waiting time was too long.",
    generate: "Generate Three Replies",
    generating: "Generating...",
    resultTitle: "Three Reply Styles",
    copy: "Copy",
    plan1: "Basic Plan",
    plan1p: "100 review replies per month. Ideal for small businesses.",
    plan2: "Professional Plan",
    plan2p: "500 review replies per month. Ideal for restaurants, beauty, and clinics.",
    plan3: "Enterprise Plan",
    plan3p: "Multi-location, reports, negative review alerts, and automation.",
    price1: "NT$499/mo",
    price2: "NT$999/mo",
    price3: "Custom",
    titles: ["Professional", "Premium Brand", "Crisis Handling"],
    emptyAlert: "Please enter a review",
    authAlert: "Please enter Email and Password",
    signupOk: "Registration successful. Please login.",
    monitorTitle: "Add Business for Review Monitoring",
    monitorDesc: "Enter your Google Maps link and notification email. New reviews will be monitored and reply suggestions can be sent by email.",
    businessName: "Business name",
    googleUrl: "Google Maps link",
    notifyEmail: "Notification email",
    addBusiness: "Add Business",
    addBusinessOk: "Business added successfully",
    addBusinessFail: "Failed to add business",
  },
  zh: {
    tag: "Google 評論回覆建議系統",
    pill: "免費試用 3 次｜適合店家立即測試",
    title: "讓每一則評論回覆，都提升顧客對你的好感與信任",
    subtitle:
      "貼上顧客評論，系統會直接提供三種不同回應方式：專業親切、高級品牌、危機處理。幫助商家快速處理好評、普通評論與負面評論。",
    f1: "專業親切",
    f1d: "適合大多數日常評論，回覆自然、有禮貌。",
    f2: "高級品牌",
    f2d: "適合醫美、精品、餐飲品牌，提升質感形象。",
    f3: "危機處理",
    f3d: "面對負評也能得體回應，降低評論傷害。",
    f4: "提升效率",
    f4d: "不用反覆想文案，貼上評論即可產生三種版本。",
    cta: "現在開始免費試用，立即體驗差別。",
    start: "開始免費試用",
    authDesc: "建立帳號後即可獲得 3 次免費回覆建議。",
    login: "登入",
    register: "免費註冊",
    authNote: "不用信用卡，註冊即可試用。每次產生會一次給你三種不同回應方式。",
    logout: "登出",
    heroPill: "三種回覆一次產生",
    heroSubtitle:
      "貼上顧客評論，系統會從不同角度產生三種可公開使用的回覆：專業親切、高級品牌、危機處理。協助商家更有效管理 Google 評論。",
    account: "登入帳號",
    remaining: "免費試用剩餘",
    reviewTitle: "貼上顧客評論",
    placeholder: "例如：服務不錯，但等太久，希望下次能改善。",
    generate: "產生三種回覆建議",
    generating: "生成中...",
    resultTitle: "三種不同回應方式",
    copy: "複製",
    plan1: "基本方案",
    plan1p: "每月 100 則評論建議，適合小型店家。",
    plan2: "專業方案",
    plan2p: "每月 500 則評論建議，適合餐廳、美容、醫美。",
    plan3: "企業方案",
    plan3p: "多分店、週報、負評提醒與自動化串接。",
    price1: "NT$499/月",
    price2: "NT$999/月",
    price3: "客製報價",
    titles: ["專業親切版", "高級品牌版", "危機處理版"],
    emptyAlert: "請輸入評論",
    authAlert: "請輸入 Email 和密碼",
    signupOk: "註冊成功，請登入",
    monitorTitle: "新增店家評論監控",
    monitorDesc: "輸入 Google Maps 連結與通知 Email。之後偵測到新評論時，可寄送評論內容與建議回覆。",
    businessName: "店家名稱",
    googleUrl: "Google Maps 連結",
    notifyEmail: "通知 Email",
    addBusiness: "新增店家",
    addBusinessOk: "店家新增成功",
    addBusinessFail: "店家新增失敗",
  },
  vi: {
    tag: "Hệ thống gợi ý phản hồi Google Review",
    pill: "Dùng thử miễn phí 3 lần｜Dành cho doanh nghiệp",
    title: "Biến mỗi phản hồi đánh giá thành sự tin tưởng của khách hàng",
    subtitle:
      "Dán đánh giá của khách hàng và tạo ngay ba phong cách phản hồi: Chuyên nghiệp, Thương hiệu cao cấp và Xử lý khủng hoảng.",
    f1: "Chuyên nghiệp",
    f1d: "Phù hợp cho phản hồi hằng ngày, tự nhiên và lịch sự.",
    f2: "Thương hiệu cao cấp",
    f2d: "Phù hợp cho spa, thẩm mỹ, nhà hàng và thương hiệu cao cấp.",
    f3: "Xử lý khủng hoảng",
    f3d: "Giúp phản hồi bình tĩnh với đánh giá tiêu cực.",
    f4: "Tiết kiệm thời gian",
    f4d: "Không cần mất thời gian nghĩ nội dung, tạo ngay ba phiên bản.",
    cta: "Bắt đầu dùng thử miễn phí ngay hôm nay.",
    start: "Bắt đầu dùng thử",
    authDesc: "Tạo tài khoản và nhận 3 lần dùng thử miễn phí.",
    login: "Đăng nhập",
    register: "Đăng ký miễn phí",
    authNote: "Không cần thẻ tín dụng. Mỗi lần tạo sẽ có ba phong cách phản hồi.",
    logout: "Đăng xuất",
    heroPill: "Tạo ba phong cách phản hồi",
    heroSubtitle:
      "Dán đánh giá khách hàng và nhận ba phản hồi sẵn sàng đăng công khai.",
    account: "Tài khoản",
    remaining: "Số lần dùng thử còn lại",
    reviewTitle: "Dán đánh giá khách hàng",
    placeholder: "Ví dụ: Dịch vụ tốt nhưng thời gian chờ hơi lâu.",
    generate: "Tạo ba phản hồi",
    generating: "Đang tạo...",
    resultTitle: "Ba phong cách phản hồi",
    copy: "Sao chép",
    plan1: "Gói cơ bản",
    plan1p: "100 phản hồi mỗi tháng, phù hợp cửa hàng nhỏ.",
    plan2: "Gói chuyên nghiệp",
    plan2p: "500 phản hồi mỗi tháng, phù hợp nhà hàng, spa, thẩm mỹ.",
    plan3: "Gói doanh nghiệp",
    plan3p: "Nhiều chi nhánh, báo cáo, cảnh báo đánh giá tiêu cực.",
    price1: "NT$499/tháng",
    price2: "NT$999/tháng",
    price3: "Báo giá riêng",
    titles: ["Chuyên nghiệp", "Thương hiệu cao cấp", "Xử lý khủng hoảng"],
    emptyAlert: "Vui lòng nhập đánh giá",
    authAlert: "Vui lòng nhập Email và mật khẩu",
    signupOk: "Đăng ký thành công, vui lòng đăng nhập",
    monitorTitle: "Thêm cửa hàng để theo dõi đánh giá",
    monitorDesc: "Nhập liên kết Google Maps và email nhận thông báo.",
    businessName: "Tên cửa hàng",
    googleUrl: "Liên kết Google Maps",
    notifyEmail: "Email thông báo",
    addBusiness: "Thêm cửa hàng",
    addBusinessOk: "Đã thêm cửa hàng thành công",
    addBusinessFail: "Không thể thêm cửa hàng",
  },
};

function detectLang(text) {
  if (/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text)) return "vi";
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  return "en";
}

export default function Home() {
  const [lang, setLang] = useState("en");
  const t = TEXT[lang];

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [review, setReview] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(3);

  const [businessName, setBusinessName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user || null);
  }

  async function signUp() {
    if (!email || !password) return alert(t.authAlert);

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    alert(t.signupOk);
  }

  async function signIn() {
    if (!email || !password) return alert(t.authAlert);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return alert(error.message);
    setUser(data.user);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setReview("");
    setResult("");
  }

  async function generate() {
    if (!review.trim()) return alert(t.emptyAlert);

    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert(t.login);
      setLoading(false);
      return;
    }

    const autoLang = detectLang(review);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        text: review,
        lang: autoLang,
      }),
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      setResult(data.result);
      setUsed(data.used);
      setLimit(data.limit);
    }

    setLoading(false);
  }

  async function addBusiness() {
    if (!businessName || !googleMapsUrl || !notifyEmail) {
      alert("Please fill in all fields");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert(t.login);
      return;
    }

    const { error } = await supabase.from("businesses").insert({
      user_id: user.id,
      business_name: businessName,
      google_maps_url: googleMapsUrl,
      notify_email: notifyEmail,
      is_active: true,
    });

    if (error) {
      console.log(error);
      alert(t.addBusinessFail);
      return;
    }

    alert(t.addBusinessOk);
    setBusinessName("");
    setGoogleMapsUrl("");
    setNotifyEmail("");
  }

  const remaining = Math.max(limit - used, 0);

  function renderResult() {
    if (!result) return null;

    const parts = result.split(/【一、|【二、|【三、/).filter(Boolean);

    return (
      <div style={resultBox}>
        <h3 style={resultTitle}>{t.resultTitle}</h3>

        {parts.map((text, index) => {
          const cleanText = text
            .replace(/】內容：/g, "")
            .replace(/】Content:/g, "")
            .replace(/】/g, "")
            .trim();

          return (
            <div key={index} style={singleBox}>
              <div style={singleHead}>
                <span style={tagTitle}>
                  {t.titles[index] || `Reply ${index + 1}`}
                </span>

                <button
                  style={copyBtn}
                  onClick={() => navigator.clipboard.writeText(cleanText)}
                >
                  {t.copy}
                </button>
              </div>

              <div style={singleText}>{cleanText}</div>
            </div>
          );
        })}
      </div>
    );
  }

  if (!user) {
    return (
      <main style={bg}>
        <div style={header}>
          <div style={brand}>ReviewReply Pro</div>

          <div style={rightTop}>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={langSelect}
            >
              <option value="en">EN</option>
              <option value="zh">繁中</option>
              <option value="vi">VI</option>
            </select>
          </div>
        </div>

        <div style={split}>
          <section>
            <div style={pill}>{t.pill}</div>
            <h1 style={title}>{t.title}</h1>
            <p style={subtitle}>{t.subtitle}</p>

            <div style={featureGrid}>
              <div style={featureCard}>
                <b>{t.f1}</b>
                <p>{t.f1d}</p>
              </div>
              <div style={featureCard}>
                <b>{t.f2}</b>
                <p>{t.f2d}</p>
              </div>
              <div style={featureCard}>
                <b>{t.f3}</b>
                <p>{t.f3d}</p>
              </div>
              <div style={featureCard}>
                <b>{t.f4}</b>
                <p>{t.f4d}</p>
              </div>
            </div>

            <p style={goldText}>{t.cta}</p>
          </section>

          <section style={authCard}>
            <h2 style={authTitle}>{t.start}</h2>
            <p style={authDesc}>{t.authDesc}</p>

            <input
              style={input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={btnGold} onClick={signIn}>
              {t.login}
            </button>

            <button style={btnOutline} onClick={signUp}>
              {t.register}
            </button>

            <div style={authNote}>{t.authNote}</div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={bg}>
      <div style={header}>
        <div style={brand}>ReviewReply Pro</div>

        <div style={rightTop}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={langSelect}
          >
            <option value="en">EN</option>
            <option value="zh">繁中</option>
            <option value="vi">VI</option>
          </select>

          <button style={logoutBtn} onClick={logout}>
            {t.logout}
          </button>
        </div>
      </div>

      <section style={heroCard}>
        <div>
          <div style={pill}>{t.heroPill}</div>
          <h1 style={title}>{t.title}</h1>
          <p style={subtitle}>{t.heroSubtitle}</p>
        </div>

        <div style={statusCard}>
          <p style={smallLabel}>{t.account}</p>
          <b>{user.email}</b>

          <p style={smallLabel}>{t.remaining}</p>
          <b style={goldBig}>
            {remaining} / {limit}
          </b>
        </div>
      </section>

      <section style={appShell}>
        <h2 style={appTitle}>{t.reviewTitle}</h2>

        <textarea
          style={textarea}
          rows={7}
          value={review}
          placeholder={t.placeholder}
          onChange={(e) => setReview(e.target.value)}
        />

        <button style={btnGold} onClick={generate}>
          {loading ? t.generating : t.generate}
        </button>

        {renderResult()}
      </section>

      <section style={businessBox}>
        <h2 style={appTitle}>{t.monitorTitle}</h2>
        <p style={authDesc}>{t.monitorDesc}</p>

        <input
          style={input}
          placeholder={t.businessName}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />

        <input
          style={input}
          placeholder={t.googleUrl}
          value={googleMapsUrl}
          onChange={(e) => setGoogleMapsUrl(e.target.value)}
        />

        <input
          style={input}
          placeholder={t.notifyEmail}
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
        />

        <button style={btnGold} onClick={addBusiness}>
          {t.addBusiness}
        </button>
      </section>

      <section style={plans}>
        <div style={plan}>
          <h3>{t.plan1}</h3>
          <b>{t.price1}</b>
          <p>{t.plan1p}</p>
        </div>

        <div style={planHot}>
          <h3>{t.plan2}</h3>
          <b>{t.price2}</b>
          <p>{t.plan2p}</p>
        </div>

        <div style={plan}>
          <h3>{t.plan3}</h3>
          <b>{t.price3}</b>
          <p>{t.plan3p}</p>
        </div>
      </section>
    </main>
  );
}

const bg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 20%, rgba(212,175,55,0.18), transparent 28%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06), transparent 25%), linear-gradient(135deg,#030303 0%,#0b0b0b 45%,#000 100%)",
  color: "#fff",
  padding: "50px 90px",
  fontFamily: "Arial, sans-serif",
  boxSizing: "border-box",
};

const header = {
  maxWidth: 1280,
  margin: "0 auto 45px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brand = {
  display: "inline-block",
  color: "#000",
  background: "linear-gradient(135deg,#f7d774,#d4af37)",
  padding: "10px 18px",
  borderRadius: 999,
  fontWeight: 900,
};

const rightTop = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const langSelect = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  fontWeight: 800,
};

const split = {
  maxWidth: 1280,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.15fr 430px",
  gap: 80,
  alignItems: "center",
};

const pill = {
  display: "inline-block",
  border: "1px solid rgba(212,175,55,0.4)",
  color: "#d4af37",
  padding: "9px 14px",
  borderRadius: 999,
  marginBottom: 22,
  fontWeight: 800,
};

const title = {
  fontSize: 48,
  lineHeight: 1.25,
  color: "#d4af37",
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-1px",
};

const subtitle = {
  marginTop: 28,
  maxWidth: 760,
  color: "#ddd",
  fontSize: 18,
  lineHeight: 1.9,
  fontWeight: 600,
};

const featureGrid = {
  marginTop: 34,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: 16,
};

const featureCard = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 18,
  color: "#ccc",
};

const goldText = {
  marginTop: 28,
  color: "#d4af37",
  fontSize: 18,
  fontWeight: 900,
};

const authCard = {
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 26,
  padding: 42,
  boxShadow: "0 0 80px rgba(0,0,0,0.7)",
};

const authTitle = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
};

const authDesc = {
  color: "#aaa",
  marginBottom: 24,
  lineHeight: 1.7,
};

const input = {
  width: "100%",
  padding: "16px 18px",
  borderRadius: 12,
  border: "none",
  marginBottom: 14,
  fontSize: 16,
  boxSizing: "border-box",
};

const btnGold = {
  width: "100%",
  padding: 17,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg,#f8dc75,#d4af37)",
  color: "#000",
  fontSize: 16,
  fontWeight: 900,
  marginTop: 10,
  cursor: "pointer",
};

const btnOutline = {
  width: "100%",
  padding: 15,
  borderRadius: 12,
  border: "1px solid #d4af37",
  background: "transparent",
  color: "#d4af37",
  fontSize: 16,
  fontWeight: 900,
  marginTop: 14,
  cursor: "pointer",
};

const authNote = {
  marginTop: 20,
  color: "#999",
  lineHeight: 1.7,
  fontSize: 14,
};

const logoutBtn = {
  background: "#171717",
  color: "#fff",
  border: "1px solid #333",
  padding: "12px 18px",
  borderRadius: 12,
  cursor: "pointer",
};

const heroCard = {
  maxWidth: 1280,
  margin: "0 auto 28px",
  display: "grid",
  gridTemplateColumns: "1fr 320px",
  gap: 40,
  alignItems: "center",
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))",
  border: "1px solid rgba(212,175,55,0.16)",
  borderRadius: 28,
  padding: 42,
};

const statusCard = {
  background: "rgba(0,0,0,0.38)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: 24,
};

const smallLabel = {
  color: "#999",
  marginBottom: 6,
};

const goldBig = {
  color: "#d4af37",
  fontSize: 30,
};

const appShell = {
  maxWidth: 980,
  margin: "0 auto",
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 28,
  padding: 42,
  boxShadow: "0 0 80px rgba(0,0,0,0.7)",
};

const businessBox = {
  ...appShell,
  marginTop: 32,
};

const appTitle = {
  color: "#d4af37",
  marginTop: 0,
};

const textarea = {
  width: "100%",
  padding: 18,
  borderRadius: 14,
  border: "none",
  fontSize: 16,
  boxSizing: "border-box",
};

const resultBox = {
  marginTop: 28,
  background: "#050505",
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 18,
  padding: 22,
};

const resultTitle = {
  color: "#d4af37",
  marginTop: 0,
};

const singleBox = {
  marginTop: 18,
  padding: 18,
  borderRadius: 14,
  border: "1px solid rgba(212,175,55,0.2)",
  background: "rgba(255,255,255,0.03)",
};

const singleHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const tagTitle = {
  color: "#d4af37",
  fontWeight: 900,
};

const copyBtn = {
  background: "#d4af37",
  color: "#000",
  border: "none",
  padding: "7px 14px",
  borderRadius: 10,
  fontWeight: 900,
  cursor: "pointer",
};

const singleText = {
  color: "#ddd",
  lineHeight: 1.9,
  whiteSpace: "pre-wrap",
};

const plans = {
  maxWidth: 980,
  margin: "32px auto 0",
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 16,
};

const plan = {
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 20,
};

const planHot = {
  background: "rgba(212,175,55,0.12)",
  border: "1px solid rgba(212,175,55,0.38)",
  borderRadius: 18,
  padding: 20,
};
