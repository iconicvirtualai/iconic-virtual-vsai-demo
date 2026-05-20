import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, ImageIcon, ArrowLeft } from "lucide-react";

type Order = {
  id: string;
  jobId: string;
  createdAt: string;
  imageUrl?: string;
  stagedUrl?: string;
  amount?: number;
  status: "pending" | "completed" | "failed";
  roomType?: string;
  style?: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const resp = await fetch("/api/orders/me", { signal: AbortSignal.timeout(5000) });
        const json = await resp.json().catch(() => ({}));

        if (!resp.ok) {
          setError(json?.error || `Request failed (${resp.status})`);
          return;
        }

        if (!json.ok) {
          setError(json?.error || "Failed to load orders");
          return;
        }

        setOrders(json.data || []);
      } catch (err) {
        console.warn("Error fetching orders:", err);
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800 to-amber-900 text-white text-xs font-bold">
              IV
            </div>
            <span className="text-sm font-bold tracking-widest hidden sm:block">
              ICONIC VIRTUAL<span className="text-amber-800">.AI</span>
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="/home.html"
              onClick={(e) => { e.preventDefault(); window.location.href = '/home.html'; }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 uppercase tracking-wider cursor-pointer"
            >
              Home
            </a>
            <a href="/" className="text-xs font-medium text-slate-600 hover:text-slate-900 uppercase tracking-wider">
              Workspace
            </a>
            <a href="/login" className="text-xs font-medium text-slate-600 hover:text-slate-900 uppercase tracking-wider">
              Account
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-4xl font-bold">Your Dashboard</h1>
          </div>
          <p className="text-slate-600">View your staging history, purchases, and download your images.</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-amber-800 mb-2">
              {orders.filter(o => o.status === "completed").length}
            </div>
            <p className="text-sm text-slate-600">Completed Stagings</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {orders.filter(o => o.status === "pending").length}
            </div>
            <p className="text-sm text-slate-600">In Progress</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-3xl font-bold text-slate-900 mb-2">
              ${orders.reduce((sum, o) => sum + (o.amount || 0), 0).toFixed(2)}
            </div>
            <p className="text-sm text-slate-600">Total Spent</p>
          </div>
        </div>

        {/* Orders Table/Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Your Staging History</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-amber-800" />
              <p className="mt-4 text-slate-600">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Link href="/" className="mt-4 inline-block text-sm text-amber-800 hover:text-amber-900 font-medium">
                Try staging an image
              </Link>
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ImageIcon size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 font-medium mb-2">No stagings yet</p>
              <p className="text-sm text-slate-500 mb-6">Get started by uploading your first image.</p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition"
              >
                Stage Your First Image
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Image</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Style</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-600">Amount</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                          {order.stagedUrl ? (
                            <img src={order.stagedUrl} alt="Staged" className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <ImageIcon size={16} className="text-slate-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {order.roomType && <p className="font-medium text-slate-900">{formatLabel(order.roomType)}</p>}
                          {order.style && <p className="text-xs text-slate-500">{formatLabel(order.style)}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "completed" ? "bg-green-100 text-green-800" :
                          order.status === "pending" ? "bg-blue-100 text-blue-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {order.status === "completed" ? "✓ Ready" : order.status === "pending" ? "⏳ Processing" : "✗ Failed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        ${order.amount?.toFixed(2) || "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "completed" && order.stagedUrl && (
                            <a
                              href={order.stagedUrl}
                              download
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-900 hover:border-slate-400 text-xs font-medium transition"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          )}
                          <Link
                            href={`/orders/${order.id}`}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-900 hover:border-slate-400 text-xs font-medium transition"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CTA */}
        {orders.length > 0 && (
          <div className="mt-12 text-center p-8 rounded-2xl border border-amber-200 bg-amber-50">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to stage more images?</h3>
            <p className="text-slate-600 mb-6">Upload another room and choose from 100+ design styles.</p>
            <Link
              href="/"
              className="inline-block rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition"
            >
              Stage Another Image
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));
}
