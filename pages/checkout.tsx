import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function CheckoutLauncher() {
  const router = useRouter();
  const [msg, setMsg] = useState("Starting checkout...");

  useEffect(() => {
    if (!router.isReady) return;

    const { jobId, product, planId, credits, price } = router.query;
    const productId = (typeof product === "string" && product) || (typeof planId === "string" && planId) || "";

    // Credit purchase flow. The price is looked up on the server from product id.
    if (productId) {
      (async () => {
        try {
          setMsg("Redirecting to payment...");
          const resp = await fetch("/api/create-plan-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
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

    if ((credits || price) && !productId) {
      setMsg("This checkout link is out of date. Go back to pricing and choose a pack. The price is set on the server.");
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
