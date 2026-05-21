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

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">✓</div>
            <h1 className="text-3xl font-bold">Thank You!</h1>
          </div>
          <p className="text-slate-600 mb-8">{statusText}</p>

          {downloadUrl && (
            <div className="space-y-6">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={downloadUrl}
                  alt="Purchased staging"
                  className="w-full max-h-[480px] object-contain bg-white"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={downloadFile}
                  className="w-full rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition"
                >
                  Download Your Image
                </button>

                {receiptUrl && (
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-xs uppercase tracking-wider text-slate-500 hover:text-slate-700 font-medium"
                  >
                    View Receipt
                  </a>
                )}
              </div>
            </div>
          )}

          {!loading && !downloadUrl && (
            <a
              href="/"
              className="block w-full text-center rounded-lg bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition"
            >
              Back to Staging
            </a>
          )}

          <div className="mt-8 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600 mb-4">What's next?</p>
            <a href="/" className="text-slate-800 hover:text-slate-900 font-medium">
              Stage another image →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
