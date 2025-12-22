// pages/success.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Check, ImageIcon } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Verifying payment...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    if (!session_id || typeof session_id !== "string") {
      setStatusText("Missing session_id in the URL.");
      setIsLoading(false);
      return;
    }

    const run = async () => {
      try {
        const resp = await fetch(`/api/post-checkout?session_id=${encodeURIComponent(session_id)}`);
        const json: any = await resp.json().catch(() => ({}));

        if (!resp.ok || !json.ok) {
          setStatusText(json.error || "Unable to verify payment.");
          setIsLoading(false);
          return;
        }

        setFinalUrl(json?.data?.finalUrl || null);
        setReceiptUrl(json?.data?.receiptUrl || null);
        setStatusText(json?.data?.finalUrl ? "Your staged image is ready." : "Paid, but no final image was returned.");
        setIsLoading(false);
      } catch (e) {
        console.error("[success] post-checkout error", e);
        setStatusText("Unexpected error verifying payment.");
        setIsLoading(false);
      }
    };

    run();
  }, [router.isReady, session_id]);

  const handleDownload = async () => {
    if (!finalUrl) return;
    window.location.href = finalUrl; // simple + reliable
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Payment Successful</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">Thank you for your purchase</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{statusText}</p>
        </div>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-slate-500" />
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Finalizing...</p>
            </div>
          )}

          {!isLoading && !finalUrl && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <ImageIcon size={36} className="text-slate-400" />
              <p className="text-sm text-slate-600">We couldn&apos;t load a final image for this order.</p>
            </div>
          )}

          {finalUrl && (
            <>
              <div className="relative rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-300/60" style={{ aspectRatio: "1024 / 683" }}>
                <img src={finalUrl} alt="Final staged" className="h-full w-full rounded-3xl object-cover" />
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700 hover:border-emerald-800"
                >
                  Download Image
                </button>

                {receiptUrl && (
                  <a className="text-xs uppercase tracking-[0.2em] text-slate-500 underline" href={receiptUrl} target="_blank" rel="noreferrer">
                    View receipt
                  </a>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
