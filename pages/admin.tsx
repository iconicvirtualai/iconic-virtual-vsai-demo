import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Placeholder page so your build passes. Next we’ll wire role-based access + admin tools.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900"
            >
              Go to Portal
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-700"
            >
              Back to Staging
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

