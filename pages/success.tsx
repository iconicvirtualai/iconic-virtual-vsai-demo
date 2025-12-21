// pages/success.tsx
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, LogOut } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;

  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(
    "Thank you for your payment. Preparing your download..."
  );
  const [isLoading, setIsLoading] = useState(true);

  const ranRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (ranRef.current) return;

    if (!session_id || typeof session_id !== "string") {
      setStatusText("Missing session_id in the URL.");
      setIsLoading(false);
      return;
    }

    ranRef.current = true;

    const run = async () => {
      try {
        setIsLoading(true);
        setStatusText("Finalizing your order...");

        const resp = await fetch("/api/post-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id }),
        });

        const json: any = await resp.json().catch(() => ({}));

        if (!resp.ok || !json.ok) {
          setStatusText(json.error || "Unable to finalize your order.");
          setIsLoading(false);
          return;
        }

        setFinalUrl(json.data.finalUrl);
        setStatusText("Your staged image is ready.");
        setIsLoading(false);
      } catch (e) {
        console.error("[success] post-checkout error:", e);
        setStatusText("Unexpected error while finalizing your order.");
        setIsLoading(false);
      }
    };

    void run();
  }, [router.isReady, session_id]);

  const handleDownload = async () => {
    if (!finalUrl) return;
    try {
      const response = await fetch(finalUrl);
      if (!response.ok) return;
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "iconic-virtual-staged.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("[success] download error:", err);
    }
  };

  const handleStageMore = () => router.push("/");
  const handleLogout = () => router.push("/");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check size={20} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Payment Successful
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                Thank you for your purchase
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-600">{statusText}</p>
        </div>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          {isLoading && !finalUrl && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-slate-500" />
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Fetching final image...
              </p>
            </div>
          )}

          {!isLoading && !finalUrl && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <ImageIcon size={36} className="text-slate-400" />
              <p className="text-sm text-slate-600">
                We couldn&apos;t load a final image for this order.
              </p>
            </div>
          )}

          {finalUrl && (
            <>
              <div
                className="relative rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-300/60"
                style={{ aspectRatio: "1024 / 683" }}
              >
                <img
                  src={finalUrl}
                  alt="Final staged"
                  width={1024}
                  height={683}
                  className="h-full w-full rounded-3xl object-cover"
                />
                <div className="absolute inset-0 rounded-3xl border border-slate-300/60" />
              </div>

              <div className="flex flex-col items-center gap-4 pt-4">
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700 hover:border-emerald-800"
                    onClick={handleDownload}
                    type="button"
                  >
                    <ImageIcon size={16} />
                    Download Image
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black hover:border-black"
                    onClick={handleStageMore}
                    type="button"
                  >
                    Stage More Images
                  </button>
                </div>

                <button
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-500"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
