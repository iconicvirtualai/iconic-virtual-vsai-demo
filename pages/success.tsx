// pages/success.tsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
  watermarked?: {
    url: string;
    storagePath?: string;
  };
  final?: {
    url: string;
    storagePath?: string;
  };
  error?: string;
};

export default function SuccessPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState<Job | null>(null);
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(
    "Thank you for your payment. Fetching your final staged image..."
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    if (!jobId || typeof jobId !== "string") {
      setStatusText("Missing job ID in the URL.");
      setIsLoading(false);
      return;
    }

    let poll: ReturnType<typeof setInterval> | null = null;

    const fetchJob = async () => {
      try {
        const resp = await fetch(`/api/jobs/${jobId}`);
        const json = await resp.json();
        if (!resp.ok || !json.ok) {
          setStatusText(json.error || "Unable to load job details.");
          setIsLoading(false);
          return;
        }

        const j: Job = json.data;
        setJob(j);

        if (j.status === "done" || j.status === "paid_done") {
          const url = j.final?.url || j.watermarked?.url || null;
          if (url) {
            setFinalUrl(url);
            setStatusText("Your staged image is ready.");
          } else {
            setStatusText("Finished, but no final image URL was found.");
          }
          setIsLoading(false);
        } else if (j.status === "error") {
          setStatusText(j.error || "We couldn't complete this render.");
          setIsLoading(false);
        } else {
          setStatusText("Finishing your high-resolution image...");
          setIsLoading(true);
        }
      } catch (err) {
        console.error("[success] fetchJob error:", err);
        setStatusText("Unexpected error while fetching your image.");
        setIsLoading(false);
      }
    };

    fetchJob();
    poll = setInterval(fetchJob, 2500);

    return () => {
      if (poll) clearInterval(poll);
    };
  }, [router.isReady, jobId]);

  const handleDownload = async () => {
    if (!finalUrl) return;
    try {
      const response = await fetch(finalUrl);
      if (!response.ok) {
        console.error("[success] download fetch error", response.status);
        return;
      }
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

  const handleStageMore = () => {
    router.push("/");
  };

  const handleLogout = () => {
    // If you add auth later, clear tokens/session here
    router.push("/");
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
                    <span className="font-medium">
                      {job.source.fileName}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
  <button
    className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-900 transition hover:border-slate-900"
    onClick={handleDownload}
    type="button"
  >
    <ImageIcon size={16} />
    Download Image
  </button>
  <button
    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-500"
    onClick={handleStageMore}
    type="button"
  >
    Stage More Images
  </button>
  <button
    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-500"
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
