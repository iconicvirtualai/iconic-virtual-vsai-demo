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
  processLabel: "Stage Image",
  regenerateLabel: "Regenerate Image",
  purchaseLabel: "Download Full Resolution",
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
        if (resp.ok && json.ok && json.data) {
          const rt = json.data.room_types || [];
          const st = json.data.styles || [];
          if (rt.length) {
            setRoomTypes(rt);
            setRoomType(rt[0]);
          } else {
            setRoomTypes(["living", "bed", "kitchen", "dining", "home_office"]);
            setRoomType("living");
          }
          if (st.length) {
            setStyles(st);
            setStyle(st[0]);
          } else {
            setStyles(["standard", "modern", "scandinavian", "luxury"]);
            setStyle("standard");
          }
        }
      } catch (e) {
        console.error("Failed to fetch VSAI options", e);
        setRoomTypes(["living", "bed", "kitchen", "dining", "home_office"]);
        setStyles(["standard", "modern", "scandinavian", "luxury"]);
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

  const handleRegenerate = () => {
    if (!stagedUrl || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsProcessed(true);
      setHasRegenerated(true);
      setVariationSeed((prev) => prev + 1);
      setSliderValue(55);
    }, 1600);
  };

  const checkout = async () => {
    if (!job) {
      setStatusText("No job to checkout.");
      return;
    }
    setIsProcessing(true);
    setStatusText("Processing final image...");

    try {
      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setIsProcessing(false);
        setStatusText(json.error || "Checkout failed.");
        return;
      }

      const updatedJob: Job = json.data.job;
      setJob(updatedJob);
      const url: string = json.data.downloadUrl;
      setStagedUrl(url);
      setIsProcessing(false);
      setIsProcessed(true);
      setStatusText("Download starting...");

      const a = document.createElement("a");
      a.href = url;
      a.download = "virtually-staged.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("checkout error", err);
      setIsProcessing(false);
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
                        className="flex h-10 w-10 items-center justify-center rounded-full bor
