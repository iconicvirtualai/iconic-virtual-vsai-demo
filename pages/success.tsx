// pages/success.tsx
import { useEffect, useState } from "react";

type ApiResp =
  | {
      ok: true;
      data: {
        paid: boolean;
        jobId: string | null;
        selectedIndex: number;
        selectedVariationId: string | null;
        downloadUrl: string | null;
        receiptUrl: string | null;
        invoiceUrl: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
      };
    }
  | { ok: false; error: string; raw?: any };

export default function SuccessPage() {
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Finalizing your order...");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    // ✅ client-only
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");

    if (!session_id) {
      setStatusText("Missing session_id in the URL.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // ✅ GET endpoint with session_id in query string
        const resp = await fetch(
          `/api/post-checkout?session_id=${encodeURIComponent(session_id)}`
        );

        const json: ApiResp = await resp
          .json()
          .catch(() => ({ ok: false, error: "Bad response" } as any));

        if (!resp.ok || !("ok" in json) || !json.ok) {
          setStatusText((json as any)?.error || "We couldn’t finalize your order.");
          setLoading(false);
          return;
        }

        const url = json.data.downloadUrl;

        if (!url) {
          setStatusText(
            "Payment succeeded, but we couldn't locate the final image yet. Please refresh in 10–20 seconds."
          );
          setLoading(false);
          return;
        }

        setDownloadUrl(url);
        setReceiptUrl(json.data.receiptUrl || null);
        setInvoiceUrl(json.data.invoiceUrl || null);
        setStatusText("Payment complete. Your download is ready.");
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
            Iconic Virtual.AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold">Success</h1>

          <p className="mt-4 text-slate-600">{statusText}</p>

          {downloadUrl && (
            <div className="mt-8 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img
                  src={downloadUrl}
                  alt="Purchased staging"
                  className="w-full object-cover"
                />
              </div>

              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-slate-900"
              >
                Download your image
              </a>

              <div className="flex flex-col gap-2 pt-2">
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

                {invoiceUrl && (
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-xs uppercase tracking-[0.3em] text-slate-500 underline"
                  >
                    View invoice
                  </a>
                )}
              </div>
            </div>
          )}

          {!loading && !downloadUrl && (
            <div className="mt-8 space-y-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
              >
                Refresh
              </button>

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
