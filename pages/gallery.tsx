import Head from "next/head";
import { useEffect, useState, useCallback, useRef } from "react";

const aiExamples = [
  { pair: "standard_living", style: "Modern Minimalist", room: "Living Room", location: "Brooklyn, NY" },
  { pair: "scandinavian_master", style: "Scandinavian", room: "Master Bedroom", location: "Austin, TX" },
  { pair: "coastal_kitchen", style: "Coastal", room: "Kitchen", location: "Miami, FL" },
  { pair: "coastal_dining", style: "Coastal Elegance", room: "Dining Room", location: "Nashville, TN" },
  { pair: "industrial_master", style: "Industrial Chic", room: "Master Suite", location: "Chicago, IL" },
  { pair: "coastal_living", style: "Coastal Modern", room: "Living Room", location: "Portland, OR" },
];

function RetryImg({ src, alt, lazy }: { src: string; alt: string; lazy?: boolean }) {
  const [retries, setRetries] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setCurrentSrc(src); setRetries(0); setLoaded(false); }, [src]);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleError = useCallback(() => {
    if (retries < 6) {
      const delay = 1500 + Math.random() * 1000 * (retries + 1);
      timerRef.current = setTimeout(() => {
        setRetries((r) => r + 1);
        setCurrentSrc(src + (src.includes("?") ? "&" : "?") + "r=" + Date.now());
      }, delay);
    }
  }, [retries, src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={lazy ? "lazy" : undefined}
      onError={handleError}
      onLoad={() => setLoaded(true)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    />
  );
}

function Card({ item, badge, urls, index }: { item: typeof aiExamples[0]; badge: string; urls: Record<string, string>; index: number }) {
  const beforeUrl = urls[item.pair + "_before"];
  const afterUrl = urls[item.pair + "_after"];
  const [ready, setReady] = useState(false);

  // Stagger card rendering: first pair immediately, then 800ms delay per pair
  useEffect(() => {
    if (!beforeUrl) return;
    const delay = index * 800;
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [beforeUrl, index]);

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", gap: 0 }}>
        <div style={{ flex: 1, position: "relative", height: 220, overflow: "hidden", background: "#e2e8f0" }}>
          {ready && beforeUrl && <RetryImg src={beforeUrl} alt={`${item.style} - Before`} lazy={index > 1} />}
          <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>BEFORE</span>
        </div>
        <div style={{ flex: 1, position: "relative", height: 220, overflow: "hidden", background: "#e2e8f0" }}>
          {ready && afterUrl && <RetryImg src={afterUrl} alt={`${item.style} - After`} lazy={index > 1} />}
          <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(16,185,129,0.85)", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>AFTER</span>
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
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/migrate-images")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.urls) setUrls(data.urls);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>Gallery | IconicVirtual.AI</title>
        <meta name="description" content="Browse before & after examples of AI virtual staging by IconicVirtual.AI." />
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
                <Card key={item.pair} item={item} badge="AI" urls={urls} index={i} />
              ))}
            </div>
          </section>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Ready to stage your listing?</h2>
            <p style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>Try AI staging free — no sign-up required.</p>
            <a href="/staging-dashboard.html" style={{ display: "inline-block", background: "#10b981", color: "#fff", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 16 }}>Try AI Staging Free</a>
          </div>
        </main>

        <footer style={{ textAlign: "center", padding: "40px 24px", borderTop: "1px solid #e2e8f0", color: "#999", fontSize: 14 }}>
          &copy; {new Date().getFullYear()} IconicVirtual.AI. All rights reserved.
        </footer>
      </div>
    </>
  );
}
