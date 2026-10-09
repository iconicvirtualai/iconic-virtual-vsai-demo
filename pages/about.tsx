import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | IconicVirtual.AI</title>
        <meta name="description" content="Iconic Virtual AI stages empty listing photos. Upload a room, choose a design style, and download after checkout." />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0a'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-size='18' font-weight='bold' fill='white' font-family='system-ui'%3EIV%3C/text%3E%3C/svg%3E" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ fontFamily: "Manrope, sans-serif", color: "#1a1a1a", background: "#ffffff" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #e5e5e5", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/home.html" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-flex", width: 36, height: 36, fontSize: 14, background: "linear-gradient(135deg,#0a0a0a,#18181b)", borderRadius: 10, color: "#10b981", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>IV</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>IconicVirtual.AI</span>
          </a>
          <a href="/home.html" style={{ color: "#10b981", textDecoration: "none", fontWeight: 500 }}>&larr; Back to Home</a>
        </header>
        <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>About IconicVirtual.AI</h1>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Iconic Virtual AI furnishes empty listing photos. You upload a room photo, choose a room type and a design style, and download the staged image after you pay the price on the pack you select.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Our Mission</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Physical staging takes furniture, time, and a crew. Iconic Virtual AI is a photo tool: an AI preview in the studio, and a separate pro order when you want a person on the design team to stage the image.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>What We Offer</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            The studio asks for a photo, a room type, and a style. Styles are Modern, Scandinavian, Industrial, Midcentury, Luxury, Farmhouse, Coastal, and Standard. Pro orders are submitted on the pro order form, and that form collects payment after you approve the preview. Prices are the amounts printed on each pack.
          </p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 40, marginBottom: 16 }}>Our Team</h2>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "#444", marginBottom: 20 }}>
            Iconic Virtual is a small product team building the staging studio, checkout, and pro order form on this site. Questions go to virtualstaging@iconicvirtual.ai.
          </p>
        </main>
        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e5e5e5", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
