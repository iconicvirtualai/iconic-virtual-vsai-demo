import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// UI labels + VSAI-friendly values
const roomOptions = [
  { label: "Living Room", value: "living" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Dining Area", value: "dining" },
  { label: "Primary Suite", value: "bed" },
  { label: "Home Office", value: "home_office" },
];

const styleOptions = [
  { label: "Modern Luxe", value: "luxury" },
  { label: "Scandinavian", value: "scandinavian" },
  { label: "Minimalist", value: "standard" },
  { label: "Contemporary", value: "modern" },
  { label: "Daylight Haven", value: "coastal" },
];

const variationPalette = [
  {
    label: "Cozy Plush",
    description: "Warm hues & soft light",
    accent: "from-rose-500/30 to-orange-400/30",
  },
  {
    label: "Luminous Drift",
    description: "Bright, airy illumination",
    accent: "from-sky-500/30 to-cyan-500/30",
  },
  {
    label: "Twilight Luxe",
    description: "Deep contrasts & drama",
    accent: "from-purple-500/30 to-fuchsia-500/30",
  },
];

const dragDropPatternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="none"/><path d="M14 0v28M0 14h28" stroke="%230f172a" stroke-width="0.5" opacity="0.2"/></svg>`;
const DRAG_DROP_PATTERN = `data:image/svg+xml,${encodeURIComponent(
  dragDropPatternSvg
)}`;

const DEFAULT_SETTINGS = {
  heroTitle: "Transform vacant spaces into story-rich interiors",
  heroTitleAccent: "VirtuoStage Studio",
  heroCopy:
    "Upload a room photo, pick your mood, and watch the AI stage it with thoughtful lighting, textures, and furniture.",
  backgroundGradient:
    "radial-gradient(circle at 20% 10%, rgba(14, 165, 233, 0.25), transparent 55%), radial-gradient(circle at 80% 20%, rgba(125, 211, 252, 0.2), transparent 45%), linear-gradient(180deg, #020617 0%, #0d1118 60%, #020617 100%)",
  contentGradient:
    "linear-gradient(135deg, rgba(15, 118, 110, 0.35), rgba(8, 145, 178, 0.4))",
  buttonGradient: "linear-gradient(90deg, #06b6d4, #3b82f6)",
  buttonTextColor: "#030712",
  processLabel: "Stage Image",
  regenerateLabel: "Regenerate Image",
  purchaseLabel: "Download Full Resolution",
  layoutMode: "modern",
};

// This script runs in the real browser (for embeds, Wix, etc)
const vsaiCustomScript = `const VSAI_API_BASE = "https://iconic-virtual-vsai-demo.vercel.app";

window.vsaiState = {
  userId: null,
  file: null,
  jobId: null,
  pollingId: null,
};

function vsaiGetUserId() {
  if (!window.vsaiState.userId) {
    window.vsaiState.userId = "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }
  return window.vsaiState.userId;
}

async function vsaiApi(path, options) {
  const res = await fetch(VSAI_API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options && options.headers ? options.headers : {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

function vsaiSetStatus(msg) {
  const el = document.getElementById("vsai-status");
  if (el) el.textContent = msg;
}

function vsaiSetPreviewUrl(url) {
  const img = document.getElementById("vsai-preview-img");
  if (img && url) {
    img.src = url;
  }
  if (url && window.dispatchEvent) {
    try {
      window.vsaiLatestStagedUrl = url;
      window.dispatchEvent(new CustomEvent("vsai-staged-change", { detail: { url } }));
    } catch (e) {}
  }
}

function vsaiSetPreviewFromFile(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  vsaiSetPreviewUrl(url);
}

function vsaiGetRoomType() {
  const sel = document.getElementById("vsai-room-type");
  return sel && sel.value ? sel.value : "living";
}

function vsaiGetStyle() {
  const sel = document.getElementById("vsai-style");
  return sel && sel.value ? sel.value : "standard";
}

function vsaiClearPolling() {
  if (window.vsaiState.pollingId) {
    clearInterval(window.vsaiState.pollingId);
    window.vsaiState.pollingId = null;
  }
}

function vsaiFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result || "";
      const base64 = String(result).split(",")[1] || "";
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function vsaiHandleFileInputChange(event) {
  const input = event.target;
  const file = input && input.files && input.files[0];
  if (!file) return;
  window.vsaiState.file = file;
  vsaiSetPreviewFromFile(file);
  vsaiSetStatus("Image selected.");
}

async function vsaiHandleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const dt = event.dataTransfer;
  const file = dt && dt.files && dt.files[0];
  if (!file) return;
  window.vsaiState.file = file;
  vsaiSetPreviewFromFile(file);
  vsaiSetStatus("Image dropped.");
}

async function vsaiStartRender() {
  const file = window.vsaiState.file;
  if (!file) {
    vsaiSetStatus("Please upload an image first.");
    return;
  }

  vsaiClearPolling();
  vsaiSetStatus("Uploading image...");

  const userId = vsaiGetUserId();
  const room_type = vsaiGetRoomType();
  const style = vsaiGetStyle();

  try {
    const fileBase64 = await vsaiFileToBase64(file);

    const { res: uploadRes, json: uploadJson } = await vsaiApi("/api/upload", {
      method: "POST",
      body: JSON.stringify({
        userId,
        fileName: file.name,
        fileBase64,
      }),
    });

    if (!uploadRes.ok || !uploadJson.ok) {
      vsaiSetStatus(uploadJson.error || "Upload failed.");
      return;
    }

    const publicUrl = uploadJson.data.publicUrl;
    vsaiSetStatus("Image uploaded. Starting AI staging...");

    const { res: renderRes, json: renderJson } = await vsaiApi("/api/render", {
      method: "POST",
      body: JSON.stringify({
        userId,
        imageUrl: publicUrl,
        room_type,
        style,
      }),
    });

    if (!renderRes.ok || !renderJson.ok) {
      vsaiSetStatus(renderJson.error || "Render start failed.");
      return;
    }

    const jobId = renderJson.data.jobId;
    window.vsaiState.jobId = jobId;

    vsaiSetStatus("Staging in progress...");

    window.vsaiState.pollingId = setInterval(async () => {
      if (!window.vsaiState.jobId) return;
      try {
        const { res: jobRes, json: jobJson } = await vsaiApi(
          "/api/jobs/" + window.vsaiState.jobId,
          { method: "GET" }
        );
        if (!jobRes.ok || !jobJson.ok) {
          vsaiSetStatus(jobJson.error || "Status check failed.");
          return;
        }

        const job = jobJson.data;
        if (job.status === "done" || job.status === "paid_done") {
          vsaiClearPolling();
          const imgUrl =
            (job.final && job.final.url) ||
            (job.watermarked && job.watermarked.url);
          vsaiSetPreviewUrl(imgUrl);
          vsaiSetStatus("Staging complete.");
        } else if (job.status === "error") {
          vsaiClearPolling();
          vsaiSetStatus(job.error || "Render failed.");
        } else {
          vsaiSetStatus("Staging in progress...");
        }
      } catch (e) {
        // transient poll error, ignore
      }
    }, 2500);
  } catch (e) {
    console.error(e);
    vsaiSetStatus("Unexpected error during staging.");
  }
}

async function vsaiCheckout() {
  const jobId = window.vsaiState.jobId;
  if (!jobId) {
    vsaiSetStatus("No job to checkout.");
    return;
  }

  vsaiSetStatus("Processing final image...");

  try {
    const { res, json } = await vsaiApi("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });

    if (!res.ok || !json.ok) {
      vsaiSetStatus(json.error || "Checkout failed.");
      return;
    }

    const url = json.data.downloadUrl;
    vsaiSetStatus("Download starting...");

    const a = document.createElement("a");
    a.href = url;
    a.download = "virtually-staged.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.error(e);
    vsaiSetStatus("Unexpected error during checkout.");
  }
}

window.vsaiHandleFileInputChange = vsaiHandleFileInputChange;
window.vsaiHandleDrop = vsaiHandleDrop;
window.vsaiStartRender = vsaiStartRender;
window.vsaiCheckout = vsaiCheckout;`;

const triggerVsaiHandler = (handlerName: string, event?: Event | null) => {
  if (typeof window === "undefined") return;
  const handler = (window as unknown as Record<string, unknown>)[handlerName];
  if (typeof handler === "function") {
    (handler as (...args: any[]) => void)(event);
  }
};

export default function Index() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(roomOptions[0].value);
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0].value);
  const [isDragActive, setIsDragActive] = useState(false);
  const [declutter, setDeclutter] = useState(true);
  const [dayToDusk, setDayToDusk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  const [sliderValue, setSliderValue] = useState(55);
  const [variationSeed, setVariationSeed] = useState(0);
  const [variationIndex, setVariationIndex] = useState(0);
  const settings = DEFAULT_SETTINGS;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Listen for VSAI staged image from the inline script
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: any) => {
      if (e?.detail?.url) setStagedUrl(e.detail.url);
    };
    window.addEventListener("vsai-staged-change", handler as any);
    return () => {
      window.removeEventListener("vsai-staged-change", handler as any);
    };
  }, []);

  const variations = useMemo(() => {
    if (!stagedUrl && !previewUrl) return [];
    return variationPalette.map((variation, index) => {
      const seed = variationSeed + index;
      const contrast = (1 + ((seed % 3) * 0.05)).toFixed(2);
      const saturate = (1 + ((seed % 4) * 0.08)).toFixed(2);
      const hue = (seed * 6) % 360;
      const brightness = (1 + ((seed % 2) * 0.04)).toFixed(2);
      const filter = `contrast(${contrast}) saturate(${saturate}) hue-rotate(${hue}deg) brightness(${brightness})`;
      return { ...variation, filter };
    });
  }, [previewUrl, stagedUrl, variationSeed]);

  const currentVariation =
    variations.length > 0 ? variations[variationIndex % variations.length] : null;

  const loadFile = (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setStagedUrl(null);
    setIsProcessed(false);
    setHasRegenerated(false);
    setSliderValue(55);
    setVariationSeed(0);
    setVariationIndex(0);
  };

  const handleFileCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFile(file);
      triggerVsaiHandler("vsaiHandleFileInputChange", event.nativeEvent);
    }
    event.target.value = "";
  };

  const handleProcess = () => {
    if (!previewUrl || isProcessing) return;
    triggerVsaiHandler("vsaiStartRender");
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed(true);
      setHasRegenerated(false);
      setSliderValue(55);
    }, 1400);
  };

  const handleRegenerate = () => {
    if (!previewUrl || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed(true);
      setHasRegenerated(true);
      setVariationSeed((prev) => prev + 1);
      setSliderValue(55);
    }, 1600);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      loadFile(file);
      triggerVsaiHandler("vsaiHandleDrop", event.nativeEvent);
    }
  };

  const goToPreviousVariation = () => {
    if (!variations.length) return;
    setVariationIndex((prev) => (prev - 1 + variations.length) % variations.length);
  };

  const goToNextVariation = () => {
    if (!variations.length) return;
    setVariationIndex((prev) => (prev + 1) % variations.length);
  };

  const stagedOrPreview = stagedUrl || previewUrl;

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8 bg-transparent">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
              {settings.heroTitleAccent}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 text-lg text-slate-600">{settings.heroCopy}</p>
          </div>

          <div
            className={`grid gap-8 ${
              settings.layoutMode === "modern"
                ? "lg:grid-cols-[2fr_1fr]"
                : "lg:grid-cols-[3fr_2fr]"
            }`}
          >
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div className="space-y-6">
                <p
                  id="vsai-status"
                  className="text-xs text-center uppercase tracking-[0.2em] text-slate-500"
                >
                  Awaiting upload
                </p>

                {!previewUrl ? (
                  <div
                    className={`relative flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 ${
                      isDragActive
                        ? "border-slate-700 bg-slate-50"
                        : "border-slate-300 bg-white"
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
                          or upload files
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
                ) : isProcessed && currentVariation && stagedOrPreview ? (
                  <div className="space-y-4">
                    <div
                      className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white"
                      style={{ aspectRatio: "1024 / 683" }}
                    >
                      <img
                        src={previewUrl}
                        alt="Before"
                        className="h-full w-full object-cover grayscale-50 brightness-90"
                      />
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                        }}
                      >
                        <img
                          id="vsai-preview-img"
                          src={stagedOrPreview}
                          alt="After"
                          className="h-full w-full object-cover"
                          style={{ filter: currentVariation.filter }}
                        />
                      </div>
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
                      <div className="absolute inset-y-0 left-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                          onClick={goToPreviousVariation}
                          type="button"
                        >
                          <ArrowLeft size={20} />
                        </button>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                          onClick={goToNextVariation}
                          type="button"
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
                      onChange={(event) =>
                        setSliderValue(Number(event.target.value))
                      }
                      className="w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-500"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="relative rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-300/60"
                      style={{ aspectRatio: "1024 / 683" }}
                    >
                      <img
                        src={previewUrl ?? undefined}
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

              {previewUrl && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                        Room Type
                      </p>
                      <select
                        id="vsai-room-type"
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-lg text-slate-900 outline-none transition focus:border-slate-500"
                        value={selectedRoom}
                        onChange={(event) =>
                          setSelectedRoom(event.target.value)
                        }
                      >
                        {roomOptions.map((room) => (
                          <option
                            key={room.value}
                            value={room.value}
                            className="bg-white text-slate-900"
                          >
                            {room.label}
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
                        value={selectedStyle}
                        onChange={(event) =>
                          setSelectedStyle(event.target.value)
                        }
                      >
                        {styleOptions.map((style) => (
                          <option
                            key={style.value}
                            value={style.value}
                            className="bg-white text-slate-900"
                          >
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {[
                      {
                        label: "Declutter or Furniture Removal?",
                        active: declutter,
                        onToggle: () => setDeclutter((prev) => !prev),
                      },
                      {
                        label: "Day to Dusk?",
                        active: dayToDusk,
                        onToggle: () => setDayToDusk((prev) => !prev),
                      },
                    ].map((option) => (
                      <button
                        key={option.label}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                          option.active
                            ? "border-slate-800 bg-slate-100 text-slate-900"
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                        onClick={option.onToggle}
                        type="button"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-2xl border ${
                            option.active
                              ? "border-slate-800 bg-white text-slate-900"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          <Check
                            size={16}
                            className={
                              option.active ? "text-slate-900" : "text-slate-500"
                            }
                          />
                        </span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {!isProcessed && (
                    <div className="flex justify-center">
                      <button
                        className="w-1/2 max-w-[260px] rounded-2xl border border-slate-700 bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={handleProcess}
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
                    </div>
                  )}

                  {isProcessed && currentVariation && (
                    <div className="space-y-5">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <p className="text-sm uppercase tracking-[0.4em] text-slate-500">
                            Before / After
                          </p>
                          <h2 className="text-2xl font-semibold text-slate-900">
                            Virtually staged transformation ready for review
                          </h2>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 py-3 shadow-sm">
                          <div className="flex flex-col gap-1 text-slate-700">
                            <div className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
                              Variant {variationIndex + 1} /{" "}
                              {variations.length}
                            </div>
                            <p className="text-lg font-semibold text-slate-900">
                              {currentVariation.label}
                            </p>
                            <p className="text-sm leading-relaxed text-slate-600">
                              {currentVariation.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          <button
                            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                            onClick={handleRegenerate}
                            type="button"
                            disabled={isProcessing}
                          >
                            <RefreshCw size={16} />
                            {settings.regenerateLabel}
                          </button>
                          <button
                            className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                            type="button"
                            onClick={() => triggerVsaiHandler("vsaiCheckout")}
                          >
                            {settings.purchaseLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasRegenerated && (
                    <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
                      Click the arrows to peek additional finished directions.
                    </div>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Key outcomes
              </p>
              <ul className="space-y-4 text-sm text-slate-700">
                <li>Real-time before &amp; after reveal with motion slider.</li>
                <li>Furnished presets tuned by room and style selectors.</li>
                <li>
                  Auto-crop, lighting, and mood adjustments with every request.
                </li>
              </ul>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-900">Tips</p>
                <p className="text-slate-600">
                  Use high-resolution interior photos with neutral lighting for
                  best results.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <script dangerouslySetInnerHTML={{ __html: vsaiCustomScript }} />
    </>
  );
}
