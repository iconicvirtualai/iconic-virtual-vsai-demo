// pages/index.tsx
import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImageIcon, RefreshCw, Sparkles } from "lucide-react";

type JobStatus =
  | "uploading"
  | "rendering"
  | "done"
  | "error"
  | "paid_rendering"
  | "paid_done";

type Job = {
  id: string; // your renderId/jobId
  userId: string;
  status: JobStatus;
  room_type: string;
  style: string;

  // In your app jobId === renderId, we persist it anyway for clarity
  renderId?: string;

  source?: {
    fileName?: string;
    storagePath?: string;
    publicUrl?: string;
  };

  watermarked?: { url: string; storagePath?: string };
  final?: { url: string; storagePath?: string };

  error?: string;
};

const dragDropPatternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="none"/><path d="M14 0v28M0 14h28" stroke="%230f172a" stroke-width="0.5" opacity="0.2"/></svg>`;
const DRAG_DROP_PATTERN = `data:image/svg+xml,${encodeURIComponent(dragDropPatternSvg)}`;

const DEFAULT_SETTINGS = {
  heroTitle: "Transform vacant spaces into story-rich interiors",
  heroTitleAccent: "Iconic Virtual.AI Studio",
  heroCopy: "Upload a photo. Pick your mood. Watch the magic happen.",
  processLabel: "Stage Image",
  regenerateLabel: "Regenerate Image",
  layoutMode: "modern",
};

const TEN_MB = 10 * 1024 * 1024;
const RESIZE_THRESHOLD_BYTES = 4 * 1024 * 1024;
const TARGET_RESIZED_BYTES = 3 * 1024 * 1024;
const HARD_MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (txt) => txt[0].toUpperCase() + txt.slice(1));
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const base64 = String(result).split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Resize an image file client-side to be under `maxBytes` (approx)
async function resizeImageToMaxSize(file: File, maxBytes: number): Promise<File> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      const maxWidth = 2400;
      let { width, height } = image;

      if (width > maxWidth) {
        const scale = maxWidth / width;
        width = maxWidth;
        height = height * scale;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      let quality = 0.9;

      const attempt = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            if (blob.size <= maxBytes || quality <= 0.3) {
              const resizedFile = new File(
                [blob],
                file.name.replace(/\.\w+$/, "") + "_resized.jpg",
                { type: "image/jpeg" }
              );
              resolve(resizedFile);
              return;
            }

            quality -= 0.1;
            attempt();
          },
          "image/jpeg",
          quality
        );
      };

      attempt();
    };

    image.onerror = () => resolve(file);
    image.src = URL.createObjectURL(file);
  });
}

export default function Index() {
  const settings = DEFAULT_SETTINGS;

  // Image + job state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);

  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Awaiting upload");

  // VSAI options
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string>("living");
  const [style, setStyle] = useState<string>("standard");

  // UI state
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  const [sliderValue, setSliderValue] = useState(55);

  // Variations carousel
  const [variationUrls, setVariationUrls] = useState<string[]>([]);
  const [currentVariationIndex, setCurrentVariationIndex] = useState<number>(0);

  // Regenerate modal
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [modalRoomType, setModalRoomType] = useState<string>("living");
  const [modalStyle, setModalStyle] = useState<string>("standard");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const originalImageUrlRef = useRef<string | null>(null);

  const getUserId = () => {
    if (!userIdRef.current) {
      userIdRef.current =
        "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }
    return userIdRef.current;
  };

  // Fetch VSAI options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const resp = await fetch("/api/vsai-options");
        const json = await resp.json().catch(() => ({}));

        const data = json?.ok ? json.data : json;

        const rt: string[] = data?.room_types || data?.roomTypes || [];
        const st: string[] = data?.styles || data?.style_list || data?.design_styles || [];

        const finalRoomTypes =
          rt.length > 0 ? rt : ["living", "bed", "kitchen", "dining", "home_office"];
        const finalStyles =
          st.length > 0 ? st : ["standard", "modern", "scandinavian", "luxury"];

        setRoomTypes(finalRoomTypes);
        setStyles(finalStyles);
        setRoomType(finalRoomTypes[0]);
        setStyle(finalStyles[0]);
      } catch (e) {
        console.error("Failed to fetch VSAI options", e);
        const fallbackRooms = ["living", "bed", "kitchen", "dining", "home_office"];
        const fallbackStyles = ["standard", "modern", "scandinavian", "luxury"];
        setRoomTypes(fallbackRooms);
        setStyles(fallbackStyles);
        setRoomType(fallbackRooms[0]);
        setStyle(fallbackStyles[0]);
      }
    };

    fetchOptions();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [previewUrl]);

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = (
    jobIdToPoll: string,
    fallbackImageUrl: string,
    options?: { resetVariations?: boolean; appendVariation?: boolean }
  ) => {
    clearPolling();

    pollRef.current = setInterval(async () => {
      try {
        const jobResp = await fetch(`/api/jobs/${jobIdToPoll}`);
        const jobJson = await jobResp.json().catch(() => ({}));

        if (!jobResp.ok || !jobJson.ok) {
          setStatusText(jobJson?.error || "Status check failed.");
          return;
        }

        const j: Job = jobJson.data;

        setJob((prev) => ({
          ...(prev || ({} as Job)),
          ...j,
          source: j.source || prev?.source,
        }));

        if (j.status === "done" || j.status === "paid_done") {
          clearPolling();

          const imgUrl = j.final?.url || j.watermarked?.url || fallbackImageUrl;

          setStagedUrl(imgUrl);
          setIsProcessing(false);
          setIsProcessed(true);
          setStatusText("Staging complete.");

          setVariationUrls((prev) => {
            if (options?.resetVariations || prev.length === 0) {
              setCurrentVariationIndex(0);
              return [imgUrl];
            }
            if (options?.appendVariation) {
              if (!prev.includes(imgUrl)) {
                const next = [...prev, imgUrl];
                setCurrentVariationIndex(next.length - 1);
                return next;
              }
            }
            return prev;
          });

          return;
        }

        if (j.status === "error") {
          clearPolling();
          setIsProcessing(false);
          setStatusText(j.error || "Render failed.");
          return;
        }

        setStatusText("Staging in progress...");
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2500);
  };

  const currentFinalUrl = useMemo(() => {
    if (variationUrls.length > 0) {
      const idx = Math.min(variationUrls.length - 1, Math.max(0, currentVariationIndex));
      return variationUrls[idx];
    }
    return stagedUrl || previewUrl;
  }, [variationUrls, currentVariationIndex, stagedUrl, previewUrl]);

  const stagedOrPreview = currentFinalUrl || previewUrl;

  const handleResetFile = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);

    setFile(null);
    setPreviewUrl(null);
    setStagedUrl(null);

    setJob(null);
    setJobId(null);

    setVariationUrls([]);
    setCurrentVariationIndex(0);

    setIsProcessed(false);
    setHasRegenerated(false);

    setStatusText("Awaiting upload");
  };

  const handleNewFile = async (f: File) => {
    if (f.size > HARD_MAX_FILE_SIZE) {
      setStatusText("File too large. Please upload an image under 50MB.");
      return;
    }

    let workingFile = f;

    if (f.size > TEN_MB) {
      setStatusText("Large file detected. Optimizing image for faster staging...");
    } else if (f.size > RESIZE_THRESHOLD_BYTES) {
      setStatusText("Optimizing image for upload...");
    }

    if (f.size > RESIZE_THRESHOLD_BYTES) {
      try {
        workingFile = await resizeImageToMaxSize(f, TARGET_RESIZED_BYTES);
      } catch {
        workingFile = f;
      }
    }

    setFile(workingFile);

    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(workingFile);
    setPreviewUrl(url);

    setStagedUrl(null);
    setIsProcessed(false);
    setHasRegenerated(false);
    setSliderValue(55);

    setVariationUrls([]);
    setCurrentVariationIndex(0);

    setStatusText("Image selected.");
  };

  const handleFileCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) void handleNewFile(f);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => setIsDragActive(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const f = event.dataTransfer.files?.[0];
    if (f) void handleNewFile(f);
  };

  const startRender = async () => {
    if (!file) {
      setStatusText("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    setIsProcessed(false);
    setStatusText("Uploading image...");

    try {
      const userId = getUserId();
      const fileBase64 = await fileToBase64(file);

      // 1) Upload original
      const uploadResp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, fileName: file.name, fileBase64 }),
      });

      if (uploadResp.status === 413) {
        setIsProcessing(false);
        setStatusText("Upload failed: image payload too large. Try a smaller image.");
        return;
      }

      const uploadJson: any = await uploadResp.json().catch(() => ({}));
      if (!uploadResp.ok || !uploadJson.ok) {
        setIsProcessing(false);
        setStatusText(uploadJson.error || "Upload failed.");
        return;
      }

      const imageUrl: string = uploadJson.data.publicUrl;
      originalImageUrlRef.current = imageUrl;

      setStatusText("Image uploaded. Starting AI staging...");

      // 2) Create VSAI render
      const renderResp = await fetch("/api/vsai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, imageUrl, room_type: roomType, style }),
      });

      const renderJson: any = await renderResp.json().catch(() => ({}));
      if (!renderResp.ok || !renderJson.ok) {
        setIsProcessing(false);
        setStatusText(renderJson.error || "Render start failed.");
        return;
      }

      const newJobId: string = renderJson.data.jobId;
      const initialStatus: JobStatus = renderJson.data.status || "rendering";

      const initialJob: Job = {
        id: newJobId,
        renderId: newJobId,
        userId,
        status: initialStatus,
        room_type: roomType,
        style,
        source: { fileName: file.name, publicUrl: imageUrl },
      };

      setJob(initialJob);
      setJobId(newJobId);

      setVariationUrls([]);
      setCurrentVariationIndex(0);

      setStatusText("Staging in progress...");
      startPolling(newJobId, imageUrl, { resetVariations: true });
    } catch (err) {
      console.error("startRender error", err);
      setIsProcessing(false);
      setStatusText("Unexpected error during staging.");
    }
  };

  const handleProcessClick = () => {
    if (!previewUrl || isProcessing) return;
    void startRender();
  };

  // Regenerate modal
  const openRegenerateModal = () => {
    const baseUrl = job?.source?.publicUrl || originalImageUrlRef.current;
    if (!baseUrl) {
      setStatusText("No original job/image to regenerate.");
      return;
    }
    if (isProcessing) return;

    setModalRoomType(roomType || job?.room_type || "living");
    setModalStyle(style || job?.style || "standard");
    setIsRegenerateModalOpen(true);
  };

  const closeRegenerateModal = () => setIsRegenerateModalOpen(false);

  // Regenerate: request ONE new result and append to carousel
  const handleRegenerateClick = async (overrideRoomType?: string, overrideStyle?: string) => {
    const imageUrl = job?.source?.publicUrl || originalImageUrlRef.current || "";
    if (!imageUrl) {
      setStatusText("No original job/image to regenerate.");
      return;
    }

    const renderId = job?.renderId || job?.id || "";
    if (!renderId) {
      setStatusText("Missing renderId.");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setIsProcessed(false);
    setStatusText("Requesting a new variation from AI...");

    try {
      const roomTypeValue = overrideRoomType || roomType || job?.room_type || "living";
      const styleValue = overrideStyle || style || job?.style || "standard";

      const resp = await fetch("/api/vsai-variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderId,
          room_type: roomTypeValue,
          style: styleValue,
        }),
      });

      const json: any = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok) {
        setIsProcessing(false);
        setStatusText(json?.error || "Variation request failed.");
        return;
      }

      const newUrl: string | null = json?.data?.resultImageUrl || null;

      if (newUrl) {
        setVariationUrls((prev) => {
          // ensure we have at least the first staged URL in the carousel
          const seeded =
            prev.length > 0
              ? prev
              : stagedUrl
              ? [stagedUrl]
              : [];

          if (!seeded.includes(newUrl)) {
            const next = [...seeded, newUrl];
            setCurrentVariationIndex(next.length - 1);
            return next;
          } else {
            const idx = seeded.indexOf(newUrl);
            if (idx >= 0) setCurrentVariationIndex(idx);
            return seeded;
          }
        });

        setStagedUrl(newUrl);
        setHasRegenerated(true);
        setSliderValue(55);

        setIsProcessing(false);
        setIsProcessed(true);
        setStatusText("Staging complete.");
        return;
      }

      // Fallback: poll the renderId to pick up the new output
      setHasRegenerated(true);
      setSliderValue(55);
      setStatusText("Staging in progress...");
      startPolling(renderId, imageUrl, { appendVariation: true });
    } catch (err: any) {
      console.error("[UI] handleRegenerateClick error", err);
      setIsProcessing(false);
      setStatusText(err?.message || "Variation failed.");
    }
  };

  const handleModalReStage = async () => {
    setRoomType(modalRoomType);
    setStyle(modalStyle);
    setIsRegenerateModalOpen(false);
    await handleRegenerateClick(modalRoomType, modalStyle);
  };

  const handlePurchaseClick = async () => {
    if (!job) {
      setStatusText("No staged image to purchase yet.");
      return;
    }

    setStatusText("Redirecting to checkout...");

    try {
      const resp = await fetch("/api/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          selectedIndex: currentVariationIndex ?? 0,
        }),
      });

      const json: any = await resp.json().catch(() => ({}));
      const checkoutUrl: string | undefined = json?.url;

      if (!resp.ok || !checkoutUrl) {
        setStatusText(json?.error || "Stripe checkout failed (missing url).");
        return;
      }

      // Escape Wix iframe if embedded
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = checkoutUrl;
          return;
        }
      } catch {
        // ignore
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("handlePurchaseClick error", err);
      setStatusText("Unexpected error during checkout.");
    }
  };

  const handlePrevVariation = () => {
    if (variationUrls.length <= 1) return;
    setCurrentVariationIndex((prev) => (prev === 0 ? variationUrls.length - 1 : prev - 1));
  };

  const handleNextVariation = () => {
    if (variationUrls.length <= 1) return;
    setCurrentVariationIndex((prev) => (prev === variationUrls.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 bg-transparent">
          {/* Hero */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
              {settings.heroTitleAccent}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 text-lg text-slate-600">{settings.heroCopy}</p>
          </div>

          {/* Main layout */}
          <div
            className={`grid gap-8 ${
              settings.layoutMode === "modern"
                ? "lg:grid-cols-[2fr_1fr]"
                : "lg:grid-cols-[3fr_2fr]"
            }`}
          >
            {/* Left */}
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="space-y-6">
                <p className="text-xs text-center uppercase tracking-[0.2em] text-slate-500">
                  {statusText}
                </p>

                {/* Drag/drop or preview */}
                {!previewUrl ? (
                  <>
                    <div
                      className={`relative flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 ${
                        isDragActive ? "border-slate-700 bg-slate-50" : "border-slate-300 bg-white"
                      }`}
                      style={{
                        backgroundImage: isDragActive
                          ? `linear-gradient(rgba(248,249,250,0.95), rgba(248,249,250,0.95)), url("${DRAG_DROP_PATTERN}")`
                          : `url("${DRAG_DROP_PATTERN}")`,
                        backgroundSize: "70px 70px",
                        backgroundRepeat: "repeat",
                      }}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 text-center">
                        <ImageIcon size={32} className="text-slate-500" />
                        <p className="text-2xl font-semibold leading-snug text-slate-900">
                          Drag &amp; Drop
                          <span className="block text-base text-slate-500">
                            or upload files (limited to 10MB)
                          </span>
                        </p>
                        <span className="rounded-full border border-slate-400 px-5 py-2 text-sm font-medium text-slate-900">
                          Browse files
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileCapture}
                        />
                      </label>
                    </div>

                    <div className="mt-4 text-center">
                      <a
                        href="https://www.iconicvirtual.ai"
                        className="text-xs font-medium uppercase tracking-[0.3em] text-slate-500 underline"
                      >
                        return to home
                      </a>
                    </div>
                  </>
                ) : isProcessed && stagedOrPreview ? (
                  <div className="space-y-4">
                    <div
                      className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white"
                      style={{ aspectRatio: "1024 / 683" }}
                    >
                      {/* Before */}
                      <img
                        src={previewUrl || undefined}
                        alt="Before"
                        className="h-full w-full object-cover grayscale brightness-95"
                      />

                      {/* After overlay */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
                      >
                        <img
                          src={stagedOrPreview || undefined}
                          alt="After"
                          className="h-full w-full object-cover"
                        />

                        {/* Watermark overlay */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="select-none text-2xl md:text-3xl font-semibold tracking-[0.2em] text-slate-900/70 mix-blend-multiply">
                            ICONICVIRTUAL.AI
                          </span>
                        </div>
                      </div>

                      {/* Slider line + knob */}
                      <div
                        className="absolute inset-y-0 -ml-0.5 hidden w-px bg-white/80 sm:block"
                        style={{ left: `${sliderValue}%` }}
                      />
                      <div
                        className="pointer-events-none absolute -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg"
                        style={{ left: `calc(${sliderValue}% - 1.5rem)` }}
                      >
                        <Sparkles size={20} />
                      </div>

                      {/* Variation arrows */}
                      <div className="absolute inset-y-0 left-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600 disabled:opacity-50"
                          onClick={handlePrevVariation}
                          type="button"
                          disabled={variationUrls.length <= 1}
                        >
                          <ArrowLeft size={20} />
                        </button>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600 disabled:opacity-50"
                          onClick={handleNextVariation}
                          type="button"
                          disabled={variationUrls.length <= 1}
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={sliderValue}
                      onChange={(event) => setSliderValue(Number(event.target.value))}
                      className="w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-500"
                    />

                    <div className="text-center text-sm text-slate-600">
                      Use the arrows &amp; slider to explore staged variations.
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900 disabled:opacity-50"
                        onClick={openRegenerateModal}
                        type="button"
                        disabled={isProcessing}
                      >
                        <RefreshCw size={16} />
                        {settings.regenerateLabel}
                      </button>

                      <a
                        href="https://www.iconicvirtual.ai/orders"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                      >
                        Submit for Pro Staging
                      </a>

                      <button
                        type="button"
                        onClick={handlePurchaseClick}
                        disabled={isProcessing}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900 disabled:opacity-50"
                      >
                        Purchase Staging – $5
                      </button>
                    </div>

                    <p className="mt-3 text-center text-xs uppercase tracking-[0.4em] text-slate-500">
                      <a href="/" className="underline">
                        return to main menu
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="relative rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-300/60"
                      style={{ aspectRatio: "1024 / 683" }}
                    >
                      <img
                        src={previewUrl || undefined}
                        alt="Uploaded preview"
                        width={1024}
                        height={683}
                        className="h-full w-full rounded-3xl object-cover"
                      />
                      <div className="absolute inset-0 rounded-3xl border border-slate-300/60" />
                      {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-slate-50/90 text-center">
                          <span className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-slate-500" />
                          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                            Rendering furniture...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Controls (only before render) */}
              {previewUrl && !isProcessed && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                        Room Type
                      </p>
                      <select
                        id="vsai-room-type"
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-500"
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                      >
                        {roomTypes.map((rt) => (
                          <option key={rt} value={rt} className="bg-white text-slate-900">
                            {formatLabel(rt)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                        Style Type
                      </p>
                      <select
                        id="vsai-style"
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-500"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                      >
                        {styles.map((s) => (
                          <option key={s} value={s} className="bg-white text-slate-900">
                            {formatLabel(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <button
                      className="w-1/2 max-w-[260px] rounded-2xl border border-slate-700 bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={handleProcessClick}
                      type="button"
                      disabled={!previewUrl || isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-transparent border-t-slate-700" />
                          Processing...
                        </span>
                      ) : (
                        settings.processLabel
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetFile}
                      className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 underline"
                      disabled={isProcessing}
                    >
                      upload a different file
                    </button>
                  </div>
                </div>
              )}

              {/* Hint after regen */}
              {hasRegenerated && isProcessed && (
                <div className="text-center text-xs uppercase tracking-[0.4em] text-slate-500">
                  Use the arrows &amp; slider to explore staged variations.
                </div>
              )}
            </section>

            {/* Right */}
            <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Key Features
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 text-slate-500" />
                  <span>AI staged photos in 1–3 minutes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 text-slate-500" />
                  <span>
                    File size impacts render speed{" "}
                    <span className="text-slate-500">
                      (file sizes over 10MB will be automatically resized for optimal use).
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 text-slate-500" />
                  <span>Real-time Before &amp; After Reveal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 text-slate-500" />
                  <span>Different Style Variations.</span>
                </li>
              </ul>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-900">Tips</p>
                <p className="mt-1 text-slate-600">
                  Use high-resolution photos with neutral/bright lighting for best results.
                </p>
                <p className="mt-1 text-slate-600">For fastest results, limit file sizes to 10MB.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Regenerate modal */}
      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30">
            <div className="mb-4 space-y-3">
              <h3 className="text-xl font-semibold text-slate-900">Choose new staging options</h3>
              <p className="text-sm text-slate-600">
                Pick a new room &amp; style. We’ll generate one new variation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  className="text-xs uppercase tracking-[0.4em] text-slate-500"
                  htmlFor="modal-room-type"
                >
                  Room Type
                </label>
                <select
                  id="modal-room-type"
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-500"
                  value={modalRoomType}
                  onChange={(event) => setModalRoomType(event.target.value)}
                >
                  {roomTypes.map((rt) => (
                    <option key={rt} value={rt} className="bg-white text-slate-900">
                      {formatLabel(rt)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs uppercase tracking-[0.4em] text-slate-500"
                  htmlFor="modal-style-type"
                >
                  Style Type
                </label>
                <select
                  id="modal-style-type"
                  className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-500"
                  value={modalStyle}
                  onChange={(event) => setModalStyle(event.target.value)}
                >
                  {styles.map((s) => (
                    <option key={s} value={s} className="bg-white text-slate-900">
                      {formatLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-500"
                onClick={closeRegenerateModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-slate-900 disabled:opacity-50"
                onClick={handleModalReStage}
                disabled={isProcessing}
              >
                Re-Stage Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
