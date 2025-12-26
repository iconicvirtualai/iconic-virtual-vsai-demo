// pages/portal.tsx  (OR pages/portal/index.tsx)
import type { NextPage } from "next";
import Link from "next/link";

const PortalPage: NextPage = () => {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Iconic Virtual.AI
          </p>

          <h1 className="mt-3 text-3xl font-semibold">Client Portal</h1>
          <p className="mt-4 text-slate-600">
            Portal is live. Next step: show user orders + download links.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
            >
              Back to staging
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-slate-900"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PortalPage;

