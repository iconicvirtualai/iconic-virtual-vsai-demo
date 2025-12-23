const supaReady =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supaReady) {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-3 text-slate-600">
            Supabase isn’t configured yet. Add{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel.
          </p>
          <a className="mt-6 inline-block underline" href="/">
            Back to staging
          </a>
        </div>
      </div>
    </main>
  );
}
