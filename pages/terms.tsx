import Head from "next/head";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service | IconicVirtual.AI</title>
        <meta name="description" content="Terms of Service for IconicVirtual.AI virtual staging platform." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231a1a1a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='bold' fill='white' font-family='system-ui'%3EIV%3C/text%3E%3C/svg%3E" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "Roboto, sans-serif", color: "#1a1a1a", background: "#faf8f5" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/home.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 36, height: 36, fontSize: 14, background: "linear-gradient(135deg,#8B7355,#8B7355)", borderRadius: 10, color: "#fff", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>IV</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>IconicVirtual.AI</span>
          </a>
          <a href="/home.html" style={{ color: "#8B7355", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Home</a>
        </header>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: "#999", marginBottom: 30 }}>Last updated: May 2025</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>1. Acceptance of Terms</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            By accessing or using IconicVirtual.AI (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use the Platform.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>2. Service Description</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            IconicVirtual.AI provides AI-powered and professional virtual staging services for real estate listings. Users may upload photos of properties and receive digitally staged versions of those images.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>3. User Accounts</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate information when creating an account.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>4. Payment and Billing</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Certain features require payment. All fees are non-refundable unless otherwise stated. Pricing is subject to change with reasonable notice.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>5. Intellectual Property</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            You retain ownership of photos you upload. AI-staged images are licensed to you for use in property marketing. The Platform, its design, code, and branding remain the property of IconicVirtual.AI.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>6. Limitation of Liability</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            IconicVirtual.AI is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>7. Contact</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            For questions about these Terms, please contact us through our <a href="/home.html#contact" style={{ color: "#8B7355" }}>contact form</a>.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e5e5e5", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
