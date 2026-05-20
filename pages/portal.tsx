import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-amber-800 mb-4" />
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
