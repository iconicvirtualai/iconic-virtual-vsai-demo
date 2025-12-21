import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ImageIcon, LogOut } from "lucide-react";

type JobStatus =
  | "uploading"
  | "rendering"
  | "done"
  | "error"
  | "paid_rendering"
  | "paid_done";

type Job = {
  id: string;
  userId: string;
  status: JobStatus;
  source?: {
    fileName?: string;
    storagePath?: string;
    publicUrl?: string;
  };
  watermarked?: { url: string; storagePath?: string };
  final?: { url: string; storagePath?: string };
  error?: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const { jobId, session_id } = router.query;

  const [job, setJob] = useState<Job | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [statusText, setStatusText] = useState(
    "Thank you for your payment. Preparing your download..."
  );
  const [isLoading, setIsLoading] = useState(true);

  const didSendRef = useRef(false);

  const sessionIdStr = useMemo(() => {
    if (typeof session_id === "string") return session_id;
    return null;
  }, [session_id]);

  const jobIdStr = useMemo(() => {
    if (typeof jobId === "string") return jobId;
    return null;
  }, [jobId]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!jobIdStr) {
      setStatusText("Missing job ID in the URL.");
      setIsLoading(false);
      return;
    }

    if (!sessionIdStr) {
      setStatusText("Missing Stripe session_id in the URL.");
      setIsLoading(false);
      return;
    }

    const run = async () => {
      try {
        // 1) Verify session + get metadata + receipt
        const sResp = await fetch(`/api/stripe-session?session_id=${encodeURIComponent(sessionIdStr)}`);
        const sJson: any = await sResp.json().catch(() => ({}));

        if (!sResp.ok || !sJson?.ok) {
          setStatusText(sJson?.error || "Unable to verify payment.");
          setIsLoading(false);
          return;
        }

        const paymentStatus = sJson?.data?.payment_status;
        const metadata = sJson?.data?.metadata || {};
        setReceiptUrl(sJson?.data?.receipt_url || null);

        if (paymentStatus !== "paid") {
          setStatusText("Payment not confirmed yet. If you just paid, refresh in a moment.");
          setIsLoading(false);
          return;
        }

        // 2) If metadata has renderId+variationId, load the correct variation URL
        const renderId = metadata.renderId || metadata.jobId || "";
        const variationId = metadata.variationId || "";

        if (renderId && variationId) {
          const vResp = await fetch(
            `/api/vsai-variation-result?renderId=${encodeURIComponent(renderId)}&variationId=${encodeURIComponent(variationId)}`
          );
          const vJson: any = await vResp.json().catch(() => ({}));

          if (vResp.ok && vJson?.ok && vJson?.data?.url) {
            setFinalUrl(vJson.data.url);
            setStatusText("Your staged image is ready.");
            setIsLoading(false);
          } else {
            // fallback: job lookup
            setStatusText("Payment confirmed. Fetching your staged image...");
          }
        } else {
          setStatusText("Payment confirmed. Fetching your staged image...");
        }

        // 3) Fallback: pull job final/watermarked if we still don't have a URL
        if (!finalUrl) {
          const jResp = await fetch(`/api/jobs/${jobIdStr}`);
          const jJson: any = await jResp.json().catch(() => ({}));

          if (jResp.ok && jJson?.ok) {
            const j: Job = jJson.data;
            setJob(j);

            const url = j.final?.url || j.watermarked?.url || null;
            if (url) {
              setFinalUrl(url);
              setStatusText("Your staged image is ready.");
            } else {
              setStatusText("Paid, but no image URL was found.");
            }
          } else {
            setStatusText(jJson?.error || "Unable to load job details.");
          }

          setIsLoading(false);
        }

        // 4) Trigger delivery (email + SMS) once
        if (!didSendRef.current) {
          didSendRef.current = true;
          await fetch("/api/post-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionIdStr }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("[success] error:", err);
        setStatusText("Unexpected error while preparing your download.");
        setIsLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, jobIdStr, sessionIdStr]);

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

          {receiptUrl && (
            <p className="mt-3 text-sm">
              <a className="underline text-slate-700" href={receiptUrl} target="_blank" rel="noreferrer">
                View Receipt
              </a>
            </p>
          )}
        </div>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          {isLoading && !finalUrl && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-slate-500" />
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Preparing download...
              </p>
            </div>
          )}

          {!isLoading && !finalUrl && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <ImageIcon size={36} className="text-slate-400" />
              <p className="text-sm text-slate-600">
                We couldn&apos;t load a final image for this job.
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

              <div className="space-y-3 text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Your staged image is ready
                </p>
                {job?.source?.fileName && (
                  <p className="text-xs text-slate-500">
                    Original file:{" "}
                    <span className="font-medium">{job.source.fileName}</span>
                  </p>
                )}
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
