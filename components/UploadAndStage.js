// components/UploadAndStage.js
import { useCallback, useState } from "react";
import { storage } from "../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function UploadAndStage() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFiles = useCallback(
    async (files) => {
      if (!files || !files.length) return;
      const file = files[0];

      try {
        setStatus("uploading");
        setMessage("Uploading to Firebase Storage...");

        const path = `orders/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);

        setStatus("staging");
        setMessage("Sending to VirtualStagingAI for staging...");

        const vsaiResp = await fetch("/api/vsai-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            roomType: "living",
            style: "modern",
            declutterMode: "off",
            addFurniture: true,
            resolution: "full-hd",
            addWatermark: true
          })
        });

        if (!vsaiResp.ok) {
          let err;
          try {
            err = await vsaiResp.json();
          } catch {
            err = {};
          }
          throw new Error(err.error || "Failed to create VSAI render");
        }

        const data = await vsaiResp.json();

        if (!data.resultImageUrl) {
          throw new Error("VSAI did not return a resultImageUrl");
        }

        setPreviewUrl(data.resultImageUrl);
        setDownloadUrl(data.resultImageUrl);
        setStatus("ready");
        setMessage("Render completed. You can now proceed to payment.");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage(err.message || "Something went wrong");
      }
    },
    []
  );

  const onDrop = (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onBrowseChange = (event) => {
    handleFiles(event.target.files);
  };

  const preventDefaults = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handlePay = async () => {
    if (!downloadUrl) return;

    try {
      setStatus("paying");
      setMessage("Redirecting to Stripe checkout...");

      const resp = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadUrl })
      });

      if (!resp.ok) {
        let err;
        try {
          err = await resp.json();
        } catch {
          err = {};
        }
        throw new Error(err.error || "Stripe checkout failed");
      }

      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned from Stripe");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Payment error");
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}
    >
      <div
        onDrop={onDrop}
        onDragOver={preventDefaults}
        onDragEnter={preventDefaults}
        onDragLeave={preventDefaults}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          cursor: "pointer"
        }}
      >
        <p style={{ fontWeight: "600", marginBottom: "8px" }}>
          Drag & drop a photo here
        </p>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          or click to browse
        </p>
        <input type="file" accept="image/*" onChange={onBrowseChange} />
      </div>

      <div style={{ fontSize: "14px" }}>
        <strong>Status:</strong> {status}
        {message && (
          <div style={{ marginTop: "4px", color: "#555" }}>{message}</div>
        )}
      </div>

      {previewUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: "8px" }}>Preview</p>
            <img
              src={previewUrl}
              alt="Staged preview"
              style={{
                width: "100%",
                borderRadius: "8px",
                border: "1px solid #ddd"
              }}
            />
          </div>

          <button
            onClick={handlePay}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#000",
              color: "#fff",
              fontSize: "14px",
              cursor: "pointer",
              alignSelf: "flex-start"
            }}
          >
            Pay with Stripe to Download
          </button>
        </div>
      )}
    </div>
  );
}
