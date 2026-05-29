// pages/login.tsx
import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [statusText, setStatusText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusText("Signing in...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setStatusText(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user?.id || "");
      localStorage.setItem("userEmail", data.user?.email || email);
      setStatusText("Success! Redirecting...");
      router.push("/staging-dashboard.html");
    } catch (err: any) {
      setStatusText(err.message || "Network error.");
      setLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusText("Creating account...");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setStatusText(data.error || "Signup failed.");
        setLoading(false);
        return;
      }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userId", data.user?.id || "");
      localStorage.setItem("userEmail", data.user?.email || email);
      setStatusText("Account created! Redirecting...");
      router.push("/staging-dashboard.html");
    } catch (err: any) {
      setStatusText(err.message || "Network error.");
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Log In | Iconic Virtual.AI</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          className="w-full max-w-md mx-4 p-8 rounded-2xl"
          style={{
            background: "#ffffff",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontFamily: "'Sora', sans-serif",
                fontWeight: 700, fontSize: 14,
              }}
            >
              IV
            </div>
            <span
              style={{
                fontFamily: "'Sora', sans-serif", fontWeight: 700,
                fontSize: 18, color: "#0a0a0a", letterSpacing: "0.02em",
              }}
            >
              ICONIC VIRTUAL.AI
            </span>
          </div>

          <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 28, color: "#0a0a0a", textAlign: "center", marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
            {mode === "login" ? "Sign in to your account to continue staging." : "Sign up for a new account to get started."}
          </p>

          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => alert("Google sign-in coming soon")}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: "#e5e7eb", color: "#6b7280", background: "#f9fafb" }}>
              Google
            </button>
            <button type="button" onClick={() => alert("Apple sign-in coming soon")}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium"
              style={{ borderColor: "#e5e7eb", color: "#6b7280", background: "#f9fafb" }}>
              Apple
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {statusText && (
            <p className="text-sm text-center mb-3" style={{
              color: statusText.includes("Success") || statusText.includes("created") ? "#10b981"
                : statusText.includes("failed") || statusText.includes("error") || statusText.includes("Invalid") ? "#ef4444" : "#6b7280",
            }}>{statusText}</p>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
            {mode === "signup" && (
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#e5e7eb" }} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: "#e5e7eb" }} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                style={{ borderColor: "#e5e7eb" }} type="email" autoComplete="email"
                placeholder="you@brokerage.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
              <input className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                style={{ borderColor: "#e5e7eb" }} type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {mode === "signup" && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (optional)</label>
                <input className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: "#e5e7eb" }} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between mb-4">
                <label className="flex items-center gap-2 text-xs text-gray-500">
                  <input type="checkbox" defaultChecked className="rounded" /> Remember me
                </label>
                <button type="button" className="text-xs" style={{ color: "#10b981" }}
                  onClick={() => alert("Password reset coming soon")}>Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-semibold text-sm transition"
              style={{
                background: loading ? "#6b7280" : "linear-gradient(135deg, #10b981, #059669)",
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" className="font-semibold" style={{ color: "#10b981" }}
                  onClick={() => { setMode("signup"); setStatusText(""); setLoading(false); }}>Sign up free</button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="font-semibold" style={{ color: "#10b981" }}
                  onClick={() => { setMode("login"); setStatusText(""); setLoading(false); }}>Sign in</button>
              </>
            )}
          </p>
        </div>
      </main>
    </>
  );
}
