// pages/success.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Success() {
  const router = useRouter();
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const { downloadUrl } = router.query;
    if (typeof downloadUrl === "string") {
      setDownloadUrl(downloadUrl);
    }
  }, [router.isReady, router.query]);

  const handleBackToMain = () => {
    router.push("/");
  };

  const handleLogout = () => {
    // Placeholder: when you add Auth, hook real logout here
    router.push("/"); // for now just send them home
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "#f3f4f6",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          boxSizing: "border-box"
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "8px",
            textAlign: "center"
          }}
        >
          Thank you for your purchase!
        </h1>

        <p
          style={{
            marginBottom: "20px",
            color: "#4b5563",
            textAlign: "center",
            fontSize: "14px"
          }}
        >
          Your virtually staged image is ready. You can download it below, or
          return to the main menu.
        </p>

        {downloadUrl ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "center"
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "480px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                backgroundColor: "#f9fafb"
              }}
            >
              <img
                src={downloadUrl}
                alt="Purchased staged image"
                style={{
                  width: "100%",
                  display: "block",
                  objectFit: "contain"
                }}
              />
            </div>

            <a
              href={downloadUrl}
              download
              style={{
                display: "inline-block",
                padding: "10px 18px",
                borderRadius: "9999px",
                backgroundColor: "#16a34a",
                color: "#ffffff",
                fontSize: "14px",
                textDecoration: "none",
                textAlign: "center"
              }}
            >
              Download Purchased Image
            </a>
          </div>
        ) : (
          <p
            style={{
              textAlign: "center",
              color: "#9ca3af",
              fontSize: "13px",
              marginBottom: "16px"
            }}
          >
            Loading your image...
          </p>
        )}

        {/* Nav options */}
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <button
            onClick={handleBackToMain}
            style={{
              padding: "8px 14px",
              borderRadius: "9999px",
              border: "1px solid #d4d4d4",
              backgroundColor: "#ffffff",
              color: "#111827",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Back to Main Menu
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: "8px 14px",
              borderRadius: "9999px",
              border: "1px solid #d4d4d4",
              backgroundColor: "#ffffff",
              color: "#111827",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Log Out of Client Account
          </button>
        </div>
      </div>
    </main>
  );
}
