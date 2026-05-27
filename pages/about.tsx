import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | IconicVirtual.AI</title>
        <meta name="description" content="Learn about IconicVirtual.AI — the AI-powered virtual staging platform helping real estate professionals sell homes faster." />
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
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>About IconicVirtual.AI</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            IconicVirtual.AI is transforming how real estate professionals present listings. Our AI-powered virtual staging platform turns empty rooms into beautifully designed spaces in under 60 seconds — for as little as $1 per photo.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Our Mission</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We believe every listing deserves to make a stunning first impression. Traditional staging is expensive and time-consuming. We built IconicVirtual.AI to make professional-quality staging accessible to every agent, broker, and property manager — regardless of budget or market size.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>What We Offer</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            From AI-powered instant staging to professional designer-curated virtual staging, we provide a full range of solutions. Our platform serves over 12,000 agents nationwide with fast turnaround, realistic results, and seamless integration into listing workflows.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Our Team</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            We are a team of real estate technologists, AI engineers, and design professionals passionate about helping homes sell faster. Based in the heart of real estate innovation, we work every day to push the boundaries of what AI can do for property marketing.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e5e5e5", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
