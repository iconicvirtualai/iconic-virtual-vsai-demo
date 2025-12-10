// components/UploadAndStage.js
import { useCallback, useEffect, useState } from "react";
import { storage } from "../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function UploadAndStage() {
  // Image + URLs
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState(null);
  const [vacantPreviewUrl, setVacantPreviewUrl] = useState(null); // decluttered / removal_output
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState(null); // staged result_image_url

  // Options from VSAI
  const [roomTypes, setRoomTypes] = useState([]);
  const [styles, setStyles] = useState([]);
  const [roomType, setRoomType] = useState("living");
  const [style, setStyle] = useState("modern");

  // Control checkboxes
  const [removeExisting, setRemoveExisting] = useState(true);
  const [addFurniture, setAddFurniture] = useState(true);

  // Status
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  // Load room types & styles from VSAI /options
  useEffect(() => {
    async function loadOptions() {
      try {
        const resp = await fetch("/api/vsai-options");
        if (!resp.ok) throw new Error("Failed to load VSAI options");
        const data = await resp.json();
        const rt = data.roomTypes || [];
        const st = data.styles || [];

        setRoomTypes(rt);
        setStyles(st);

        if (rt.length > 0) setRoomType(rt[0]);
        if (st.length > 0) setStyle(st[0]);
      } catch (err) {
        console.error(err);
        // Fallback to known defaults if API fails
        const fallbackRoomTypes = [
          "living",
          "bed",
          "kitchen",
          "dining",
          "bathroom",
          "home_office",
          "outdoor",
          "kids_room"
        ];
        const fallbackStyles = [
          "modern",
          "scandinavian",
          "industrial",
          "midcentury",
          "luxury",
          "farmhouse",
          "coastal",
          "standard"
        ];
        setRoomTypes(fallbackRoomTypes);
        setStyles(fallbackStyles);
        setRoomType(fallbackRoomTypes[0]);
        setStyle(fallbackStyles[0]);
      }
    }

    loadOptions();
  }, []);

  // Handle file upload to Firebase Storage
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

        setUploadedImageUrl(imageUrl);
        setOriginalPreviewUrl(imageUrl);
        setVacantPreviewUrl(null);
        setStagedPreviewUrl(null);

        setStatus("uploaded");
        setMessage("Image uploaded. Adjust options and click 'Stage Now'.");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMessage(err.message || "Upload failed");
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

  // Determine declutter/staging mode for VSAI
  const computeVsaiOptions = () => {
    if (!removeExisting && !addFurniture) {
      throw new Error("Please select at least one option: Remove and/or Add Furniture.");
    }

    let declutterMode = "off";
    let addFurnitureFlag = addFurniture;

    if (removeExisting && !addFurniture) {
      // Declutter only
      declutterMode = "on";
      addFurnitureFlag = false;
    } else if (removeExisting && addFurniture) {
      // Declutter + staging
      declutterMode = "on";
      addFurnitureFlag = true;
    } else if (!removeExisting && addFurniture) {
      // Staging only
      declutterMode = "off";
      addFurnitureFlag = true;
    }

    return { declutterMode, addFurnitureFlag };
  };

  // Call VSAI to stage/declutter based on settings
  const handleStageNow = async () => {
    if (!uploadedImageUrl) {
      setStatus("error");
      setMessage("Please upload an image first.");
      return;
    }

    try {
      const { declutterMode, addFurnitureFlag } = computeVsaiOptions();

      setStatus("staging");
      setMessage("Sending image to VirtualStagingAI...");

      const vsaiResp = await fetch("/api/vsai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          roomType,
          style,
          declutterMode, // 'off' | 'on' | 'auto'
          addFurniture: addFurnitureFlag,
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
      const stagedUrl = data.resultImageUrl || null;
      const vacantUrl = data.removalOutput || null;

      setStagedPreviewUrl(stagedUrl);
      setVacantPreviewUrl(vacantUrl);

      if (stagedUrl || vacantUrl) {
        setStatus("ready");
        setMessage(
          vacantUrl && stagedUrl
            ? "Vacant and staged images ready. You can regenerate or purchase."
            : "Image ready. You can regenerate or purchase."
        );
      } else {
        setStatus("error");
        setMessage("VSAI did not return any output images.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Staging failed");
    }
  };

  // Purchase button (Stripe)
  const handlePay = async () => {
    const urlToBuy = stagedPreviewUrl || vacantPreviewUrl;
    if (!urlToBuy) {
      setStatus("error");
      setMessage("No image available to purchase yet.");
      return;
    }

    try {
      setStatus("paying");
      setMessage("Redirecting to Stripe checkout...");

      const resp = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadUrl: urlToBuy })
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

  // Regenerate = call VSAI again with the same settings
  const handleRegenerate = async () => {
    // Just call handleStageNow again
    await handleStageNow();
  };

  // --- UI layout: left 1/3 controls, right 2/3 image/drop zone ---
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        borderRadius: "16px",
        border: "1px solid #ddd",
        padding: "16px",
        display: "flex",
        gap: "16px",
        boxSizing: "border-box"
      }}
    >
      {/* LEFT 1/3: Controls */}
      <div style={{ flex: "0 0 33%", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Remove existing furniture */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <input
            type="checkbox"
            checked={removeExisting}
            onChange={(e) => setRemoveExisting(e.target.checked)}
          />
          <span>Remove existing furniture</span>
        </label>

        {/* Add Furniture toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          <input
            type="checkbox"
            checked={addFurniture}
            onChange={(e) => setAddFurniture(e.target.checked)}
          />
          <span>Add furniture</span>
        </label>

        {/* Room type + style dropdowns (only if Add Furniture is enabled) */}
        {addFurniture && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "8px"
            }}
          >
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              style={{
                flex: 1,
                borderRadius: "8px",
                padding: "6px 8px",
                border: "1px solid #ccc",
                fontSize: "13px"
              }}
            >
              {roomTypes.map((rt) => (
                <option key={rt} value={rt}>
                  {rt}
                </option>
              ))}
            </select>

            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{
                flex: 1,
                borderRadius: "8px",
                padding: "6px 8px",
                border: "1px solid #ccc",
                fontSize: "13px"
              }}
            >
              {styles.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stage Now Button */}
        <button
          onClick={handleStageNow}
          style={{
            marginTop: "16px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#111827",
            color: "#fff",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          Stage Now
        </button>

        {/* Status + message */}
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <strong>Status:</strong> {status}
          {message && (
            <div style={{ marginTop: "4px", color: "#4b5563" }}>{message}</div>
          )}
        </div>

        {/* Purchase / Regenerate buttons (only after we have output) */}
        {(vacantPreviewUrl || stagedPreviewUrl) && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={handlePay}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#16a34a",
                color: "#fff",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Purchase
            </button>
            <button
              onClick={handleRegenerate}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d4d4d4",
                backgroundColor: "#f9fafb",
                color: "#111827",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* RIGHT 2/3: Image preview + drag & drop */}
      <div style={{ flex: "0 0 67%", display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Drag & Drop uploader */}
        <div
          onDrop={onDrop}
          onDragOver={preventDefaults}
          onDragEnter={preventDefaults}
          onDragLeave={preventDefaults}
          style={{
            border: "2px dashed #cbd5f5".replace("f5", "f5"), // just a soft blue-ish
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#f9fafb"
          }}
        >
          <p style={{ fontWeight: "600", marginBottom: "8px" }}>
            Drag & drop a photo here
          </p>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
            or click to browse
          </p>
          <input type="file" accept="image/*" onChange={onBrowseChange} />
        </div>

        {/* Preview area */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px"
          }}
        >
          {/* Original preview */}
          <div
            style={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              padding: "8px",
              minHeight: "120px",
              boxSizing: "border-box"
            }}
          >
            <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
              Original
            </p>
            {originalPreviewUrl ? (
              <img
                src={originalPreviewUrl}
                alt="Original"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb"
                }}
              />
            ) : (
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                Upload a photo to see it here.
              </p>
            )}
          </div>

          {/* Vacant + Staged side-by-side vertically */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            {/* Vacant preview */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "8px",
                minHeight: "80px",
                boxSizing: "border-box"
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                Vacant (Decluttered)
              </p>
              {vacantPreviewUrl ? (
                <img
                  src={vacantPreviewUrl}
                  alt="Vacant"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Will appear here when decluttering is used.
                </p>
              )}
            </div>

            {/* Staged preview */}
            <div
              style={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                padding: "8px",
                minHeight: "80px",
                boxSizing: "border-box"
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                Staged
              </p>
              {stagedPreviewUrl ? (
                <img
                  src={stagedPreviewUrl}
                  alt="Staged"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb"
                  }}
                />
              ) : (
                <p style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Staged result will appear here after rendering.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
