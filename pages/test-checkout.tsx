import { useState } from "react";

export default function TestCheckoutPage() {
  const [status, setStatus] = useState<string>("");

  const startTestCheckout = async () => {
    setStatus("Creating Stripe Checkout session...");

    const resp = await fetch("/api/stripe-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: "test_job_" + Date.now() }),
    });

    const json: any = await resp.json().catch(() => ({}));

    if (!resp.ok || !json.url) {
      setStatus(json.error || "Stripe checkout failed.");
      return;
    }

    const url = String(json.url);

    // Works inside Wix iframe too
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url;
        return;
      }
    } catch {}

    window.location.href = url;
  };

  return (
    <main style={{ padding: 24, fontFamily: "Manrope, sans-serif" }}>
      <h1>Test Stripe Checkout (No VSAI credits)</h1>
      <p>This will create a Stripe Checkout session with a fake jobId.</p>

      <button
        onClick={startTestCheckout}
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #111",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Start Test Checkout
      </button>

      {status && <p style={{ marginTop: 16 }}>{status}</p>}
    </main>
  );
}
