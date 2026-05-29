import Head from "next/head";

export default function CareersPage() {
  return (
    <>
      <Head>
        <title>Careers | IconicVirtual.AI</title>
        <meta name="description" content="Join the IconicVirtual.AI team and help transform real estate marketing with AI." />
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
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>Careers at IconicVirtual.AI</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We are always looking for talented, driven individuals who share our passion for AI, real estate technology, and beautiful design.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Why Work With Us</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            At IconicVirtual.AI, you will work at the intersection of cutting-edge AI and one of the largest industries in the world. We offer a fast-paced, collaborative environment where your work directly impacts how homes are marketed and sold across the country.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Open Positions</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We do not have any open positions listed at this time. However, we are always interested in hearing from exceptional candidates. If you believe you would be a great fit, reach out to us via our <a href="/home.html#contact" style={{ color: "#10b981" }}>contact form</a>.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
