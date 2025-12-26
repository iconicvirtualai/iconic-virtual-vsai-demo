// pages/login.tsx
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();

  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [supaReady, setSupaReady] = useState(false);
  const [statusText, setStatusText] = useState<string>("Loading login...");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // IMPORTANT:
  // - Do NOT create supabase client at module scope (breaks build if env missing)
  // - Only create it in the browser
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!url || !anon) {
      setStatusText(
        "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
      );
      setSupaReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const mod = await import("@supabase/supabase-js");
        const supa = mod.createClient(url, anon);

        if (cancelled) return;
        setClient(supa);
        setSupaReady(true);
        setStatusText("Please sign in.");
      } catch (e: any) {
        console.error(e);
        setStatusText("Failed to initialize auth.");
        setSupaReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setStatusText("Signing in...");

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatusText(error.message || "Login failed.");
      return;
    }

    if (!data?.session) {
      setStatusText("No session returned.");
      return;
    }

    setStatusText("Success! Redirecting...");
    router.push("/portal");
  };

  // ✅ NOW the return is inside the component body (fixes your build error)
  if (!supaReady) {
    return (
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-md px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
              Iconic Virtual.AI
            </p>
            <h1 className="mt-3 text-2xl font-semibold">Login</h1>
            <p className="mt-4 text-slate-600">{statusText}</p>

            <a
              href="/"
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
            >
              Return to staging
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Iconic Virtual.AI
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Login</h1>
          <p className="mt-4 text-slate-600">{statusText}</p>

          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Email
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Password
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:border-slate-900"
            >
              Sign In
            </button>

            <a
              href="/"
              className="block text-center text-xs uppercase tracking-[0.3em] text-slate-500 underline"
            >
              Return to staging
            </a>
          </form>
        </div>
      </div>
    </main>
  );
}
