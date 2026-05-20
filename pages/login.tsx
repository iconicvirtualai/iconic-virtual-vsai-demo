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
      <main className="min-h-screen bg-slate-50 text-slate-900">
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
          </div>
        </header>

        <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">Login</h1>
            <p className="text-slate-600 mb-8">{statusText}</p>

            <a
              href="/"
              className="block w-full text-center rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition"
            >
              Back to Staging
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-2">Login</h1>
          <p className="text-slate-600 mb-8">{statusText}</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-slate-700 block mb-2">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-100 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest font-semibold text-slate-700 block mb-2">
                Password
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-100 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-3 font-semibold text-white hover:shadow-lg transition"
            >
              Sign In
            </button>

            <a
              href="/"
              className="block text-center text-xs uppercase tracking-wider text-slate-500 hover:text-slate-700 font-medium"
            >
              Back to Staging
            </a>
          </form>
        </div>
      </div>
    </main>
  );
}
