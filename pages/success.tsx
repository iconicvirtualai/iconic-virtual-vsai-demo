// pages/success.tsx
import { useEffect, useState } from "react";

type ApiResp =
  | {
      ok: true;
      data: {
        paid: boolean;
        jobId: string | null;
        selectedUrl: string | null;
        selectedIndex: number | null;
        receiptUrl: string | null;
        invoiceUrl: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        smsSent: boolean;
      };
    }
  | { ok: false; error: string };

export async function getServerSideProps() {
  return { props: {} };
}

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Finalizing your order...");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const downloadFile = async () => {
    if (!downloadUrl) return;

    try {
      const resp = await fetch(downloadUrl);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "iconic-virtual-staged.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error(e);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    }
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");

    if (!session_id) {
      setStatusText("Missing session_id in the URL.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const resp = await fetch("/api/post-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id }),
        });

        const json: ApiResp = await resp
          .json()
          .catch(() => ({ ok: false, error: "Bad response" } as any));

        if (!resp.ok || !json.ok) {
          setStatusText((json as any)?.error || "We couldn’t finalize your order.");
          setLoading(false);
          return;
        }

        const selectedUrl = json.data.selectedUrl;
        if (!selectedUrl) {
          setStatusText("Payment succeeded, but we couldn't find the purchased image.");
          setLoading(false);
          return;
        }

        setDownloadUrl(selectedUrl);
        setReceiptUrl(json.data.receiptUrl || null);
        setStatusText("Your Staged Image is Ready.");
        setLoading(false);
      } catch (e) {
        console.error(e);
        setStatusText("Unexpected error finalizing order.");
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Payment Successful
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-slate-900"> Thank you for your purchase</h1>
          <p className="mt-4 text-slate-600">{statusText}</p>

          {downloadUrl && (
            <div className="mt-8 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img
                  src={downloadUrl}
                  alt="Purchased staging"
                  className="w-full max-h-[420px] object-contain bg-white"
                />
              </div>

              <button
                type="button"
                onClick={downloadFile}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-slate-900"
              >
                Download your image
              </button>

              {receiptUrl && (
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-xs uppercase tracking-[0.3em] text-slate-500 underline"
                >
                  View receipt
                </a>
              )}
            </div>
          )}

          {!loading && !downloadUrl && (
            <div className="mt-8">
              <a
                href="/"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
              >
                Return to staging
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
