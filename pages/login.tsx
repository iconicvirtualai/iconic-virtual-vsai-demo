import { useEffect } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the staging-dashboard where login is actually located
    router.replace("/staging-dashboard.html");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-amber-800 mb-4" />
        <p className="text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
