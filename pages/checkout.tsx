import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Starting checkout...");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { jobId } = router.query;

    if (!jobId || typeof jobId !== "string") {
      setMsg("Missing jobId. Please go back and try again.");
      setShowError(true);
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
        setShowError(true);
      }
    })();
  }, [router.isReady, router.query]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white text-xs font-bold">
              IV
            </div>
            <span className="text-sm font-bold tracking-widest hidden sm:block">
              ICONIC VIRTUAL<span className="text-slate-800">.AI</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          {!showError ? (
            <>
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Checkout</h1>
              <p className="text-slate-600">{msg}</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Checkout Error</h1>
              <p className="text-slate-600 mb-6">{msg}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => router.back()} className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:border-slate-400 transition">
                  Go Back
                </button>
                <Link href="/" className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition">
                  Back to Staging
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
