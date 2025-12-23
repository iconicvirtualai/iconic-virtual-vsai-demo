import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  const signIn = async () => {
    setStatus("Signing in...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Signed in. Go to portal.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setStatus("Signed out.");
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/60">
          <h1 className="text-2xl font-semibold">Login</h1>
          <p className="mt-2 text-sm text-slate-600">
            Client portal login (placeholder UI, we’ll polish after).
          </p>

          <div className="mt-6 space-y-3">
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />

            <button
              type="button"
              onClick={signIn}
              className="w-full rounded-2xl border border-slate-900 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white"
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={signOut}
              className="w-full rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900"
            >
              Sign out
            </button>

            {status && <p className="text-sm text-slate-600">{status}</p>}

            <div className="pt-2 text-center text-sm">
              <Link className="underline" href="/portal">
                Go to Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

