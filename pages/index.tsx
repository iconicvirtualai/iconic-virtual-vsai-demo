import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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
  room_type: string;
  style: string;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Finalizing your image...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || typeof jobId !== "string") return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`/api/jobs/${jobId}`);
        const json = await resp.json();

        if (!resp.ok || !json.ok) {
          setError(json.error || "Could not load final image.");
          setLoading(false);
          return;
        }

        const j: Job = json.data;
        setJob(j);

        if (j.status === "paid_done" || j.status === "done") {
          const url = j.final?.url || j.watermarked?.url || j.source?.publicUrl;
          if (!url) {
            setError("No image URL found on job.");
          } else {
            setImageUrl(url);
            setStatusText("Your image is ready!");
          }
        } else if (j.status === "paid_rendering" || j.status === "rendering") {
          setStatusText("We are still processing your final image...");
        } else if (j.status === "error") {
          setError(j.error || "Something went wrong generating your image.");
        }

        setLoading(false);
      } catch (e: any) {
        console.error("[success] error fetching job", e);
        setError(e.message || "Unexpected error loading job.");
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "virtually-staged.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleStageMore = () => {
    router.push("/");
  };

  // You can wire this to your actual auth logout endpoint when ready
  const handleLogout = () => {
    // Placeholder: send them home or to a login page
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
            Payment Successful
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
            Your staged image is ready
          </h1>
          <p className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-500">
            {statusText}
          </p>
        </div>

        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-transparent border-t-slate-700" />
              <p className="text-sm text-slate-600">
                Fetching your final render...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                className="rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                onClick={handleStageMore}
                type="button"
              >
                Back to Main Menu
              </button>
            </div>
          )}

          {!loading && !error && imageUrl && (
            <>
              <div
                className="relative rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-300/60"
                style={{ aspectRatio: "1024 / 683" }}
              >
                <img
                  src={imageUrl}
                  alt="Final staged"
                  className="h-full w-full rounded-3xl object-cover"
                />
                <div className="absolute inset-0 rounded-3xl border border-slate-300/60" />
              </div>

              {/* Final actions after payment success */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  className="rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                  onClick={handleDownload}
                  type="button"
                >
                  Download Image
                </button>
                <button
                  className="rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                  onClick={handleStageMore}
                  type="button"
                >
                  Stage More Images
                </button>
                <button
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-600 transition hover:border-slate-500"
                  onClick={handleLogout}
                  type="button"
                >
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
