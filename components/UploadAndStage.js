import { useState } from "react";

export default function UploadAndStage() {
  const [renderId, setRenderId] = useState("");
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("standard");
  const [removeExistingFurniture, setRemoveExistingFurniture] = useState(false);
  const [addFurniture, setAddFurniture] = useState(true);

  const [resultImageUrl, setResultImageUrl] = useState("");
  const [variationId, setVariationId] = useState("");

  const [buyerEmail, setBuyerEmail] = useState("");
  const [statusText, setStatusText] = useState("");

  async function handleCreateVariation() {
    setStatusText("Creating variation...");
    try {
      const resp = await fetch("/api/vsai-variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderId,
          roomType,
          style,
          removeExistingFurniture,
          addFurniture,
        }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || "Failed to create variation");

      setVariationId(json.variationId || "");
      setResultImageUrl(json.resultImageUrl || "");
      setStatusText("Variation ready.");
    } catch (err) {
      console.error("handleCreateVariation error", err);
      setStatusText("Unexpected error during variation.");
    }
  }

  async function handlePurchaseClick() {
    setStatusText("Starting checkout...");
    try {
      if (!buyerEmail) {
        setStatusText("Please enter your email.");
        return;
      }
      if (!resultImageUrl) {
        setStatusText("No result image yet. Generate a variation first.");
        return;
      }

      // Your stripe-checkout expects a jobId. We'll use variationId if available.
      const jobId = variationId || renderId;

      const resp = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          email: buyerEmail,
          downloadUrl: resultImageUrl,   // <-- this is the key value
          previewUrl: resultImageUrl,    // optional
          amountCents: 500               // set your price
        }),
      });

      const json = await resp.json();
      if (!resp.ok || !json.ok || !json.url) {
        throw new Error(json?.error || "Checkout failed");
      }

      const url = json.url;

      // ✅ Stripe Checkout can't load inside Wix iframe.
      // Try top-window navigation; if blocked, open a new tab.
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = url;
        } else {
          window.location.href = url;
        }
      } catch (e) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("handlePurchaseClick error", err);
      setStatusText("Unexpected error during checkout.");
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700 }}>VSAI Demo</h2>

      <div style={{ marginTop: 12 }}>
        <label>Render ID</label>
        <input
          style={{ width: "100%", padding: 10, marginTop: 6 }}
          value={renderId}
          onChange={(e) => setRenderId(e.target.value)}
          placeholder="Paste your renderId here"
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <input style={{ flex: 1, padding: 10 }} value={roomType} onChange={(e) => setRoomType(e.target.value)} placeholder="roomType" />
        <input style={{ flex: 1, padding: 10 }} value={style} onChange={(e) => setStyle(e.target.value)} placeholder="style" />
      </div>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block" }}>
          <input type="checkbox" checked={removeExistingFurniture} onChange={(e) => setRemoveExistingFurniture(e.target.checked)} /> Remove furniture
        </label>
        <label style={{ display: "block" }}>
          <input type="checkbox" checked={addFurniture} onChange={(e) => setAddFurniture(e.target.checked)} /> Add furniture
        </label>
      </div>

      <button
        onClick={handleCreateVariation}
        style={{ marginTop: 12, padding: 12, borderRadius: 10, background: "#111", color: "#fff" }}
      >
        Create Variation
      </button>

      {resultImageUrl ? (
        <div style={{ marginTop: 14 }}>
          <img src={resultImageUrl} alt="Result" style={{ width: "100%", borderRadius: 12 }} />
        </div>
      ) : null}

      <div style={{ marginTop: 16, borderTop: "1px solid #eee", paddingTop: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Pay & Download</h3>

        <input
          style={{ width: "100%", padding: 10, marginTop: 8 }}
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          placeholder="Email (required)"
        />

        <button
          onClick={handlePurchaseClick}
          style={{ marginTop: 10, padding: 12, borderRadius: 10, background: "#111", color: "#fff" }}
        >
          Pay
        </button>
      </div>

      {statusText ? <p style={{ marginTop: 12 }}>{statusText}</p> : null}
    </div>
  );
}
