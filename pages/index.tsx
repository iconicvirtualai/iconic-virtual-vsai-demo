import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
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

type JobStatus =
  | "uploading"
  | "rendering"
  | "done"
  | "error"
  | "paid_rendering"
  | "paid_done";

type Job = {
  id: string;
  userId: string;
  status: JobStatus;
  room_type: string;
  style: string;
  source?: {
    fileName?: string;
    storagePath?: string;
    publicUrl?: string;
  };
  watermarked?: {
    url: string;
    storagePath?: string;
  };
  final?: {
    url: string;
    storagePath?: string;
  };
  error?: string;
};

const variationPalette = [
  {
    label: "Cozy Plush",
    description: "Warm hues & soft light",
  },
  {
    label: "Luminous Drift",
    description: "Bright, airy illumination",
  },
  {
    label: "Twilight Luxe",
    description: "Deep contrasts & drama",
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
  processLabel: "Stage Image",
  regenerateLabel: "Regenerate Image",
  purchaseLabel: "Purchase Staged Image",
  layoutMode: "modern",
};

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

export default function Index() {
  // Image + job state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [statusText, setStatusText] = useState("Awaiting upload");

  // VSAI options
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string>("living");
  const [style, setStyle] = useState<string>("standard");

  // UI state
  const [isDragActive, setIsDragActive] = useState(false);
  const [declutter, setDeclutter] = useState(true);
  const [dayToDusk, setDayToDusk] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  const [sliderValue, setSliderValue] = useState(55);
  const [variationSeed, setVariationSeed] = useState(0);
  const [variationIndex, setVariationIndex] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const settings = DEFAULT_SETTINGS;

  // Stable per-session user id
  const getUserId = () => {
    if (!userIdRef.current) {
      userIdRef.current =
        "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    }
    return userIdRef.current;
  };

  // Fetch VSAI options from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const resp = await fetch("/api/vsai-options");
        const json = await resp.json();

        let data: any = null;
        if (json && typeof json === "object") {
          if ("ok" in json && json.ok && json.data) {
            data = json.data;
          } else {
            data = json;
          }
        }

        const rt: string[] =
          data?.room_types || data?.roomTypes || data?.room_types_list || [];
        const st: string[] =
          data?.styles || data?.style_list || data?.design_styles || [];

        const finalRoomTypes =
          rt.length > 0
            ? rt
            : ["living", "bed", "kitchen", "dining", "home_office"];
        const finalStyles =
          st.length > 0
            ? st
            : ["standard", "modern", "scandinavian", "luxury"];

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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [previewUrl]);

  const variations = useMemo(() => {
    const baseUrl = stagedUrl || previewUrl;
    if (!baseUrl) return [];
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

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleNewFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setStagedUrl(null);
    setIsProcessed(false);
    setHasRegenerated(false);
    setSliderValue(55);
    setVariationSeed(0);
    setVariationIndex(0);
    setStatusText("Image selected.");
  };

  const handleFileCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) handleNewFile(f);
    event.target.value = "";
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
    const f = event.dataTransfer.files?.[0];
    if (f) handleNewFile(f);
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

      // 1) Upload original to Firebase (orders/)
      const uploadResp = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fileName: file.name,
          fileBase64,
        }),
      });
      const uploadJson = await uploadResp.json();
      if (!uploadResp.ok || !uploadJson.ok) {
        setIsProcessing(false);
        setStatusText(uploadJson.error || "Upload failed.");
        return;
      }

      const imageUrl: string = uploadJson.data.publicUrl;
      setStatusText("Image uploaded. Starting AI staging...");

      // 2) Create VSAI render
      const renderResp = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomType,
          style,
          declutter,
          day_to_dusk: dayToDusk,
        }),
      });
      const renderJson = await renderResp.json();
      if (!renderResp.ok || !renderJson.ok) {
        setIsProcessing(false);
        setStatusText(renderJson.error || "Render start failed.");
        return;
      }

      const jobId: string = renderJson.data.jobId;
      const initialStatus: JobStatus = renderJson.data.status || "rendering";

      const initialJob: Job = {
        id: jobId,
        userId,
        status: initialStatus,
        room_type: roomType,
        style,
        source: {
          fileName: file.name,
          publicUrl: imageUrl,
        },
      };
      setJob(initialJob);

      setStatusText("Staging in progress...");

      clearPolling();
      pollRef.current = setInterval(async () => {
        try {
          const jobResp = await fetch(`/api/jobs/${jobId}`);
          const jobJson = await jobResp.json();
          if (!jobResp.ok || !jobJson.ok) {
            setStatusText(jobJson.error || "Status check failed.");
            return;
          }
          const j: Job = jobJson.data;
          setJob(j);

          if (j.status === "done" || j.status === "paid_done") {
            clearPolling();
            const imgUrl = j.final?.url || j.watermarked?.url || imageUrl;
            setStagedUrl(imgUrl);
            setIsProcessing(false);
            setIsProcessed(true);
            setStatusText("Staging complete.");
          } else if (j.status === "error") {
            clearPolling();
            setIsProcessing(false);
            setStatusText(j.error || "Render failed.");
          } else {
            setStatusText("Staging in progress...");
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2500);
    } catch (err) {
      console.error("startRender error", err);
      setIsProcessing(false);
      setStatusText("Unexpected error during staging.");
    }
  };

  const handleProcessClick = () => {
    if (!previewUrl || isProcessing) return;
    startRender();
  };

  // True re-stage via backend (new job)
  const handleRegenerateClick = async () => {
    if (!job || !job.source?.publicUrl || isProcessing) return;

    setIsProcessing(true);
    setStatusText("Requesting a new variation...");

    try {
      const userId = getUserId();
      const imageUrl = job.source.publicUrl;

      const renderResp = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomType,
          style,
          declutter,
          day_to_dusk: dayToDusk,
        }),
      });
      const renderJson = await renderResp.json();
      if (!renderResp.ok || !renderJson.ok) {
        setIsProcessing(false);
        setStatusText(renderJson.error || "Variation request failed.");
        return;
      }

      const jobId: string = renderJson.data.jobId;
      const initialStatus: JobStatus = renderJson.data.status || "rendering";

      const newJob: Job = {
        id: jobId,
        userId,
        status: initialStatus,
        room_type: roomType,
        style,
        source: job.source,
      };
      setJob(newJob);

      clearPolling();
      pollRef.current = setInterval(async () => {
        try {
          const jobResp = await fetch(`/api/jobs/${jobId}`);
          const jobJson = await jobResp.json();
          if (!jobResp.ok || !jobJson.ok) {
            setStatusText(jobJson.error || "Status check failed.");
            return;
          }
          const j: Job = jobJson.data;
          setJob(j);

          if (j.status === "done" || j.status === "paid_done") {
            clearPolling();
            const imgUrl = j.final?.url || j.watermarked?.url || imageUrl;
            setStagedUrl(imgUrl);
            setIsProcessing(false);
            setIsProcessed(true);
            setHasRegenerated(true);
            setVariationSeed((prev) => prev + 1);
            setSliderValue(55);
            setStatusText("New variation ready.");
          } else if (j.status === "error") {
            clearPolling();
            setIsProcessing(false);
            setStatusText(j.error || "Render failed.");
          } else {
            setStatusText("Staging in progress...");
          }
        } catch (err) {
          console.error("Polling error (variation)", err);
        }
      }, 2500);
    } catch (err) {
      console.error("handleRegenerateClick error", err);
      setIsProcessing(false);
      setStatusText("Unexpected error during variation request.");
    }
  };

  // Purchase -> Stripe Checkout (then /success page will call /api/checkout)
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
        body: JSON.stringify({ jobId: job.id }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.url) {
        setStatusText(json.error || "Stripe checkout failed.");
        return;
      }
      window.location.href = json.url as string;
    } catch (err) {
      console.error("handlePurchaseClick error", err);
      setStatusText("Unexpected error during checkout.");
    }
  };

  const stagedOrPreview = stagedUrl || previewUrl;

  return (
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
          {/* Left: upload + preview */}
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
            <div className="space-y-6">
              <p className="text-xs text-center uppercase tracking-[0.2em] text-slate-500">
                {statusText}
              </p>

              {/* Drag/drop or preview */}
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
                    {/* Before */}
                    <img
                      src={previewUrl || undefined}
                      alt="Before"
                      className="h-full w-full object-cover grayscale-50 brightness-90"
                    />
                    {/* After overlay */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                      }}
                    >
                      <img
                        src={stagedOrPreview || undefined}
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
                    {/* Variation arrows */}
                    <div className="absolute inset-y-0 left-4 flex items-center">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                        onClick={() =>
                          setVariationIndex(
                            (prev) =>
                              (prev - 1 + variations.length) %
                              (variations.length || 1)
                          )
                        }
                        type="button"
                      >
                        <ArrowLeft size={20} />
                      </button>
                    </div>
                    <div className="absolute inset-y-0 right-4 flex items-center">
                      <button
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                        onClick={() =>
                          setVariationIndex(
                            (prev) => (prev + 1) % (variations.length || 1)
                          )
                        }
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

            {/* Controls */}
            {previewUrl && (
              <div className="space-y-6">
                {/* Room + style */}
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
                        <option
                          key={rt}
                          value={rt}
                          className="bg-white text-slate-900"
                        >
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
                        <option
                          key={s}
                          value={s}
                          className="bg-white text-slate-900"
                        >
                          {formatLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Declutter / Day-to-dusk toggles */}
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

                {/* Main CTAs */}
                {!isProcessed && (
                  <div className="flex justify-center">
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
                            Variant {variationIndex + 1} / {variations.length}
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
                          onClick={handleRegenerateClick}
                          type="button"
                          disabled={isProcessing}
                        >
                          <RefreshCw size={16} />
                          {settings.regenerateLabel}
                        </button>
                        <button
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900"
                          type="button"
                          onClick={handlePurchaseClick}
                          disabled={isProcessing}
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

          {/* Right: explainer */}
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
  );
}
