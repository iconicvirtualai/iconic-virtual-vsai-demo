import Head from "next/head";

const aiExamples = [
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#a0896e,#8B7355)", style: "Modern Minimalist", room: "Living Room", location: "Brooklyn, NY" },
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#f0e8dc,#fbbf24)", style: "Scandinavian", room: "Master Bedroom", location: "Austin, TX" },
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#d4e8d0,#6b8f5e)", style: "Coastal", room: "Kitchen", location: "Miami, FL" },
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#fed7aa,#f97316)", style: "Bohemian", room: "Dining Room", location: "Nashville, TN" },
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#3d342c,#475569)", style: "Luxury Contemporary", room: "Master Suite", location: "Los Angeles, CA" },
  { before: "linear-gradient(135deg,#cbd5e1,#94a3b8)", after: "linear-gradient(135deg,#fef9c3,#ca8a04)", style: "Mid-Century Modern", room: "Home Office", location: "Portland, OR" },
];

const proExamples = [
  { before: "linear-gradient(135deg,#e2e8f0,#94a3b8)", after: "linear-gradient(135deg,#1e3a5f,#2563eb)", style: "Hampton Classic", room: "Grand Living Room", location: "Montauk, NY" },
  { before: "linear-gradient(135deg,#e2e8f0,#94a3b8)", after: "linear-gradient(135deg,#4a2c17,#92400e)", style: "Warm Traditional", room: "Formal Dining", location: "Greenwich, CT" },
  { before: "linear-gradient(135deg,#e2e8f0,#94a3b8)", after: "linear-gradient(135deg,#064e3b,#059669)", style: "Organic Modern", room: "Primary Suite", location: "Scottsdale, AZ" },
  { before: "linear-gradient(135deg,#e2e8f0,#94a3b8)", after: "linear-gradient(135deg,#581c87,#7c3aed)", style: "Art Deco Revival", room: "Entertainment Room", location: "Chicago, IL" },
];

function Card({ item, badge }: { item: typeof aiExamples[0]; badge: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ background: item.before, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "rgba(0,0,0,0.5)", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>BEFORE</span>
          </div>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <div style={{ background: item.after, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ background: "rgba(255,255,255,0.85)", color: "#0a0a0a", padding: "4px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>AFTER</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ background: badge === "AI" ? "#10b981" : "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{badge}</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0a0a0a" }}>{item.style}</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#666" }}>{item.room} &bull; {item.location}</p>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <>
      <Head>
        <title>Gallery | IconicVirtual.AI</title>
        <meta name="description" content="Browse before & after examples of AI virtual staging and professional designer staging by IconicVirtual.AI." />
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

        <main style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ display: "inline-block", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: "6px 16px", borderRadius: 20, marginBottom: 16 }}>GALLERY</span>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Before &amp; After Staging Examples</h1>
            <p style={{ fontSize: 18, color: "#666", maxWidth: 600, margin: "0 auto" }}>
              See how IconicVirtual.AI transforms empty rooms into beautifully staged spaces that sell homes faster.
            </p>
          </div>

          {/* AI Staging Section */}
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 28, background: "#10b981", borderRadius: 2 }}></div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>AI Virtual Staging</h2>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#888" }}>Instant results in under 60 seconds &bull; From $1/image</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 24 }}>
              {aiExamples.map((item, i) => (
                <Card key={i} item={item} badge="AI" />
              ))}
            </div>
          </section>

          {/* Pro Staging Section */}
          <section style={{ marginBottom: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 4, height: 28, background: "#2563eb", borderRadius: 2 }}></div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Professional Designer Staging</h2>
                <p style={{ margin: "4px 0 0", fontSize: 14, color: "#888" }}>Expert designers &bull; 24-hour turnaround &bull; From $6/image</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))", gap: 24 }}>
              {proExamples.map((item, i) => (
                <Card key={i} item={item} badge="PRO" />
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Ready to stage your listing?</h2>
            <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>Try AI staging free — no sign-up required. Or submit a pro order for designer-quality results.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/staging-dashboard.html" style={{ display: "inline-block", background: "#10b981", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>Try AI Staging Free</a>
              <a href="/staging-dashboard.html#pro" style={{ display: "inline-block", background: "#2563eb", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>Submit a Pro Order</a>
            </div>
          </div>
        </main>

        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
