import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CheckoutLauncher() {
  const router = useRouter();
  const [msg, setMsg] = useState("Starting checkout...");

  useEffect(() => {
    if (!router.isReady) return;

    const { jobId } = router.query;

    if (!jobId || typeof jobId !== "string") {
      setMsg("Missing jobId. Please go back and try again.");
      return;
    }

    (async () => {
      try {
        // Call your existing API that creates the Stripe Checkout Session
        const resp = await fetch("/api/stripe-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        const json = await resp.json();
        if (!json.ok || !json.url) throw new Error(json.error || "Checkout failed");

        // Top-level redirect to Stripe
        window.location.href = json.url;
      } catch (e: any) {
        setMsg(e?.message || "Checkout failed.");
      }
    })();
  }, [router.isReady, router.query]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "Arial" }}>
      <h1>Checkout</h1>
      <p>{msg}</p>
    </div>
  );
}
