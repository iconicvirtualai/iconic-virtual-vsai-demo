import Head from "next/head";

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>Help Center | IconicVirtual.AI</title>
        <meta name="description" content="Get help with IconicVirtual.AI — FAQs, guides, and support for virtual staging." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='bold' fill='white' font-family='system-ui'%3EIV%3C/text%3E%3C/svg%3E" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "Sora, sans-serif", color: "#0a0a0a", background: "#ffffff" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/home.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 36, height: 36, fontSize: 14, background: "linear-gradient(135deg,#0a0a0a,#18181b)", borderRadius: 10, color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>IV</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a" }}>IconicVirtual.AI</span>
          </a>
          <a href="/home.html" style={{ color: "#10b981", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Home</a>
        </header>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Help Center</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 30 }}>
            Find answers to common questions and learn how to get the most out of IconicVirtual.AI.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Getting Started</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            <strong>How do I create an account?</strong><br />
            Click &ldquo;Start Free&rdquo; on our homepage and fill in your details. No credit card is required to get started.
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            <strong>How does AI staging work?</strong><br />
            Upload a photo of an empty or unfurnished room, select a style, and our AI generates a professionally staged version in under 60 seconds.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Billing &amp; Credits</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            <strong>How much does it cost?</strong><br />
            AI staging starts at $1 per photo. We offer credit packages for volume discounts. Visit our pricing section for current rates.
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            <strong>Do credits expire?</strong><br />
            No, your credits never expire. Use them whenever you need.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Pro Staging</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            <strong>What is Pro Staging?</strong><br />
            Pro Staging is our premium service where professional designers create custom virtual staging for your listing. Turnaround is typically 24-48 hours.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Need More Help?</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Contact our support team through the <a href="/home.html#contact" style={{ color: "#10b981" }}>contact form</a> on our homepage. We typically respond within a few hours during business days.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
