import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CheckoutLauncher() {
  const router = useRouter();
  const [msg, setMsg] = useState("Starting checkout...");

  useEffect(() => {
    if (!router.isReady) return;

    const { jobId, credits, price } = router.query;

    // Credit purchase flow (from homepage pricing buttons)
    if (credits && price) {
      (async () => {
        try {
          setMsg("Redirecting to payment...");
          const resp = await fetch("/api/create-plan-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credits: String(credits),
              price: String(price),
            }),
          });

          const json = await resp.json();
          if (!json.url) throw new Error(json.error || "Checkout failed");

          window.location.href = json.url;
        } catch (e: any) {
          setMsg(e?.message || "Checkout failed. Please try again.");
        }
      })();
      return;
    }

    // AI staging job flow (original demo checkout)
    if (!jobId || typeof jobId !== "string") {
      setMsg("Missing jobId. Please go back and try again.");
      return;
    }

    (async () => {
      try {
        const resp = await fetch("/api/stripe-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });

        const json = await resp.json();
        if (!json.ok || !json.url) throw new Error(json.error || "Checkout failed");

        window.location.href = json.url;
      } catch (e: any) {
        setMsg(e?.message || "Checkout failed.");
      }
    })();
  }, [router.isReady, router.query]);

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16, fontFamily: "Manrope, sans-serif" }}>
      <h1>Checkout</h1>
      <p>{msg}</p>
    </div>
  );
}
