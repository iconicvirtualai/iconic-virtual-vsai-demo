import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | IconicVirtual.AI</title>
        <meta name="description" content="Privacy Policy for IconicVirtual.AI — how we collect, use, and protect your data." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='bold' fill='white' font-family='system-ui'%3EIV%3C/text%3E%3C/svg%3E" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "Manrope, sans-serif", color: "#0a0a0a", background: "#ffffff" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/home.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 36, height: 36, fontSize: 14, background: "linear-gradient(135deg,#0a0a0a,#18181b)", borderRadius: 10, color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>IV</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a" }}>IconicVirtual.AI</span>
          </a>
          <a href="/home.html" style={{ color: "#10b981", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Home</a>
        </header>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 30 }}>Last updated: May 2025</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>1. Information We Collect</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We collect information you provide directly, including your name, email address, phone number, and uploaded property photos. We also collect usage data such as browser type, IP address, and pages visited.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>2. How We Use Your Information</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We use your information to provide and improve our services, process transactions, communicate with you, and personalize your experience. We do not sell your personal information to third parties.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>3. Data Security</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We implement industry-standard security measures to protect your data, including encryption in transit and at rest. However, no method of transmission over the Internet is 100% secure.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>4. Your Photos</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Photos you upload are processed by our AI staging engine and stored securely. We do not share your photos with third parties except as necessary to provide the staging service. You may request deletion of your photos at any time.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>5. Cookies</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We use cookies and similar technologies to maintain your session and improve your experience. You can control cookie settings through your browser preferences.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>6. Contact</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            If you have questions about this Privacy Policy, please reach out through our <a href="/home.html#contact" style={{ color: "#10b981" }}>contact form</a>.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
