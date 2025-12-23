import Link from "next/link";

export default function MyOrdersPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder. Next we’ll list purchases + download links here from the database.
          </p>

          <div className="mt-8 flex gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900"
            >
              Back to Portal
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

