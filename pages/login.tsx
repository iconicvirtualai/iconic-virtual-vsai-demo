import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await resp.json();

      if (!resp.ok || !json.ok) {
        setError(json?.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Store auth token/user ID in localStorage
      if (json.data?.userId) {
        localStorage.setItem("userId", json.data.userId);
        localStorage.setItem("userEmail", email);
        if (json.data?.token) {
          localStorage.setItem("authToken", json.data.token);
        }
      }

      // Redirect to staging dashboard
      router.push("/staging-dashboard.html");
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4" suppressHydrationWarning>
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <a href="/home.html" onClick={(e) => { e.preventDefault(); window.location.href = '/home.html'; }}>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800 to-amber-900 text-white font-bold mb-4 cursor-pointer">
                IV
              </div>
            </a>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              {isSignUp ? "Create Account" : "Sign In"}
            </h1>
            <p className="text-sm text-slate-600">
              {isSignUp 
                ? "Get started with Iconic Virtual.AI"
                : "Access your staging workspace"
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-100 transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-500 outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-800 to-amber-900 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Toggle Sign Up / Login */}
          <div className="mt-6 text-center text-sm text-slate-600">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setError("");
                  }}
                  className="text-amber-800 hover:text-amber-900 font-semibold"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setError("");
                  }}
                  className="text-amber-800 hover:text-amber-900 font-semibold"
                >
                  Create one
                </button>
              </>
            )}
          </div>

          {/* Back to Home */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <a
              href="/home.html"
              onClick={(e) => { e.preventDefault(); window.location.href = '/home.html'; }}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              ← Back to Home
            </a>
          </div>
        </div>

        {/* Marketing Copy */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            <strong>Demo Credentials:</strong> Use any email/password to create an account
          </p>
        </div>
      </div>
    </main>
  );
}
