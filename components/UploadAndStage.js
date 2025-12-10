// components/UploadAndStage.js
import { useCallback, useEffect, useState } from "react";
import { storage } from "../lib/firebaseClient";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function UploadAndStage() {
  // Image + URLs
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  // All staged options (watermarked) from VSAI
  const [stagedImages, setStagedImages] = useState([]); // array of URLs
  const [currentIndex, setCurrentIndex] = useState(0);

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

  // Handle file upload to Firebase Storage (NO auto-staging)
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
        setStagedImages([]);
        setCurrentIndex(0);

        setStatus("uploaded");
        setMessage("Image uploaded. Choose options and click 'Stage Now'.");
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

  // Stage Now: manual trigger only
  const handleStageNow = async () => {
    if (!uploadedImageUrl) {
      setStatus("error");
      setMessage("Please upload an image first.");
      return;
    }

    try {
      const { declutterMode, addFurnitureFlag } = computeVsaiOptions();

      setStatus("staging");
      setMessage("Rendering your staged image...");

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

      if (!stagedUrl) {
        throw new Error("VSAI did not return a staged image.");
      }

      // Add this staged image to the slideshow (at the end)
      setStagedImages((prev) => {
        const next = [...prev, stagedUrl];
        setCurrentIndex(next.length - 1); // show newest
        return next;
      });

      setStatus("ready");
      setMessage("Staged image ready. You can regenerate or purchase below.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "Staging failed");
    }
  };

  // Purchase: buy the currently selected staged image
  const handlePay = async () => {
    if (!stagedImages.length) {
      setStatus("error");
      setMessage("No staged image available to purchase yet.");
      return;
    }

    const urlToBuy = stagedImages[currentIndex];

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

  // Regenerate = call VSAI again with the same settings (new variation)
  const handleRegenerate = async () => {
    await handleStageNow();
  };

  // Carousel navigation
  const showPrev = () => {
    if (stagedImages.length <= 1) return;
    setCurrentIndex((idx) => (idx === 0 ? stagedImages.length - 1 : idx - 1));
  };

  const showNext = () => {
    if (stagedImages.length <= 1) return;
    setCurrentIndex((idx) => (idx === stagedImages.length - 1 ? 0 : idx + 1));
  };

  // Determine what to show in the main preview:
  // - If we have staged images, show current staged
  // - Else if we have upload, show uploaded original
  let mainImage = null;
  let mainLabel = "";

  if (stagedImages.length > 0) {
    mainImage = stagedImages[currentIndex];
    mainLabel =
      stagedImages.length > 1
        ? `Staged option ${currentIndex + 1} of ${stagedImages.length}`
        : "Staged result";
  } else if (uploadedImageUrl) {
    mainImage = uploadedImageUrl;
    mainLabel = "Uploaded image (not yet staged)";
  }

  const isStaging = status === "staging";

  // --- UI layout: left 1/3 controls, right 2/3 big preview ---
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "960px",
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
      <div
        style={{
          flex: "0 0 33%",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
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
          disabled={!uploadedImageUrl || isStaging}
          style={{
            marginTop: "16px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: !uploadedImageUrl
              ? "#9ca3af"
              : isStaging
              ? "#6b7280"
              : "#111827",
            color: "#fff",
            fontSize: "14px",
            cursor: !uploadedImageUrl || isStaging ? "not-allowed" : "pointer"
          }}
        >
          {isStaging ? "Staging..." : "Stage Now"}
        </button>

        {/* Status + message */}
        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <strong>Status:</strong> {status}
          {message && (
            <div style={{ marginTop: "4px", color: "#4b5563" }}>{message}</div>
          )}
        </div>

        {/* Purchase / Regenerate buttons (only after we have outputs) */}
        {stagedImages.length > 0 && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
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
              Purchase Selected Image
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
              Regenerate New Option
            </button>
          </div>
        )}
      </div>

      {/* RIGHT 2/3: Drag & drop + big preview */}
      <div
        style={{
          flex: "0 0 67%",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        {/* Drag & Drop uploader */}
        <div
          onDrop={onDrop}
          onDragOver={preventDefaults}
          onDragEnter={preventDefaults}
          onDragLeave={preventDefaults}
          style={{
            border: "2px dashed #cbd5f5",
            borderRadius: "12px",
            padding: "16px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#f9fafb"
          }}
        >
          <p style={{ fontWeight: "600", marginBottom: "8px" }}>
            Drag & drop a photo here
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginBottom: "12px"
            }}
          >
            or click to browse
          </p>
          <input type="file" accept="image/*" onChange={onBrowseChange} />
        </div>

        {/* Big preview area (single main box) */}
        <div
          style={{
            position: "relative",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            minHeight: "360px",
            maxHeight: "520px",
            overflow: "hidden",
            backgroundColor: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box"
          }}
        >
          {/* Rendered image or uploaded image */}
          {mainImage ? (
            <div
              style={{
                width: "100%",
                height: "100%",
                padding: "8px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151"
                }}
              >
                {mainLabel}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <img
                  src={mainImage}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    objectFit: "contain"
                  }}
                />
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#9ca3af" }}>
              Upload a photo to see it here.
            </p>
          )}

          {/* Loading overlay while staging */}
          {isStaging && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(17,24,39,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "15px",
                fontWeight: 500
              }}
            >
              Rendering your staged image...
            </div>
          )}
        </div>

        {/* Simple slideshow controls under preview if multiple staged options */}
        {stagedImages.length > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "4px"
            }}
          >
            <button
              onClick={showPrev}
              style={{
                padding: "6px 10px",
                borderRadius: "9999px",
                border: "1px solid #d4d4d4",
                backgroundColor: "#fff",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              ◀ Previous
            </button>
            <button
              onClick={showNext}
              style={{
                padding: "6px 10px",
                borderRadius: "9999px",
                border: "1px solid #d4d4d4",
                backgroundColor: "#fff",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Next ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
