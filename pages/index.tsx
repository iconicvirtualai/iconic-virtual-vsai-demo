import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImageIcon,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// --- Types --------------------------------------------------------------

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

const dragDropPatternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="none"/><path d="M14 0v28M0 14h28" stroke="%230f172a" stroke-width="0.5" opacity="0.2"/></svg>`;
const DRAG_DROP_PATTERN = `data:image/svg+xml,${encodeURIComponent(
  dragDropPatternSvg
)}`;

const DEFAULT_SETTINGS = {
  heroTitle: "Transform vacant spaces into story-rich interiors",
  heroTitleAccent: "IconicVirtual.AI Studio",
  heroCopy: "Upload a photo. Pick your mood. Watch the magic happen.",
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

// --- Component ----------------------------------------------------------

export default function Index() {
  // Image + job state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedUrl, setStagedUrl] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Awaiting upload");

  // VSAI options (fetched from backend)
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string>("living");
  const [style, setStyle] = useState<string>("standard");

  // UI state
  const [isDragActive, setIsDragActive] = useState(false);
  const [declutter] = useState(false); // kept for future, but always false now
  const [dayToDusk] = useState(false); // kept for future, but always false now
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [hasRegenerated, setHasRegenerated] = useState(false);
  const [sliderValue, setSliderValue] = useState(55);

  // REAL variation images from VSAI (one per render / re-stage)
  const [variationUrls, setVariationUrls] = useState<string[]>([]);
  const [variationIndex, setVariationIndex] = useState(0);

  // Regenerate modal state
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [modalRoom, setModalRoom] = useState<string>("living");
  const [modalStyle, setModalStyle] = useState<string>("standard");

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
        setModalRoom(finalRoomTypes[0]);
        setModalStyle(finalStyles[0]);
      } catch (e) {
        console.error("Failed to fetch VSAI options", e);
        const fallbackRooms = [
          "living",
          "bed",
          "kitchen",
          "dining",
          "home_office",
        ];
        const fallbackStyles = ["standard", "modern", "scandinavian", "luxury"];
        setRoomTypes(fallbackRooms);
        setStyles(fallbackStyles);
        setRoomType(fallbackRooms[0]);
        setStyle(fallbackStyles[0]);
        setModalRoom(fallbackRooms[0]);
        setModalStyle(fallbackStyles[0]);
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

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Shared polling for initial render AND regenerations
  const startPolling = (
    jobIdToPoll: string,
    fallbackImageUrl: string,
    appendVariation: boolean
  ) => {
    clearPolling();
    pollRef.current = setInterval(async () => {
      try {
        const jobResp = await fetch(`/api/jobs/${jobIdToPoll}`);
        const jobJson = await jobResp.json();
        if (!jobResp.ok || !jobJson.ok) {
          setStatusText(jobJson.error || "Status check failed.");
          return;
        }
        const j: Job = jobJson.data;

        // IMPORTANT: preserve original source.publicUrl if backend job object doesn't include it
        setJob((prev) => {
          const merged: Job = {
            ...(prev || ({} as Job)),
            ...j,
            source: j.source || prev?.source,
          };
          return merged;
        });

        const jobNow: Job = {
          ...(job || ({} as Job)),
          ...j,
          source: j.source || job?.source,
        };

        if (jobNow.status === "done" || jobNow.status === "paid_done") {
          clearPolling();

          const imgUrl =
            jobNow.watermarked?.url ||
            jobNow.final?.url ||
            fallbackImageUrl;

          setStagedUrl(imgUrl);
          setIsProcessing(false);
          setIsProcessed(true);
          setStatusText("Staging complete.");

          setVariationUrls((prev) =>
            appendVariation ? [...prev, imgUrl] : [imgUrl]
          );
          setVariationIndex((prev) =>
            appendVariation ? prev + 1 : 0
          );
        } else if (jobNow.status === "error") {
          clearPolling();
          setIsProcessing(false);
          setStatusText(jobNow.error || "Render failed.");
        } else {
          setStatusText("Staging in progress...");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2500);
  };

  const totalVariations = variationUrls.length;
  const currentImage =
    totalVariations > 0
      ? variationUrls[Math.min(variationIndex, totalVariations - 1)]
      : stagedUrl || previewUrl;

  const handleNewFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setStagedUrl(null);
    setIsProcessed(false);
    setHasRegenerated(false);
    setSliderValue(55);
    setVariationUrls([]);
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

      // 2) Create VSAI render (preview / non-watermarked)
      const renderResp = await fetch("/api/vsai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomType,
          style,
          // declutter / day_to_dusk disabled for now
        }),
      });
      const renderJson = await renderResp.json();
      if (!renderResp.ok || !renderJson.ok) {
        setIsProcessing(false);
        setStatusText(renderJson.error || "Render start failed.");
        return;
      }

      const newJobId: string = renderJson.data.jobId;
      const initialStatus: JobStatus = renderJson.data.status || "rendering";

      const initialJob: Job = {
        id: newJobId,
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
      setJobId(newJobId);

      setStatusText("Staging in progress...");
      startPolling(newJobId, imageUrl, false);
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

  // --- Regeneration with modal + true VSAI variation --------------------

  const openRegenerateModal = () => {
    const hasSource = job?.source?.publicUrl;
    if (!hasSource) {
      setStatusText("No original job/image to regenerate.");
      return;
    }
    if (isProcessing) return;
    setModalRoom(roomType || job!.room_type || "living");
    setModalStyle(style || job!.style || "standard");
    setIsRegenerateModalOpen(true);
  };

  const handleRegenerateWithOptions = async (
    overrideRoomType?: string,
    overrideStyle?: string
  ) => {
    if (!job || !job.source?.publicUrl) {
      setStatusText("No original job/image to regenerate.");
      return;
    }
    if (isProcessing) return;

    setIsRegenerateModalOpen(false);
    setIsProcessing(true);
    setStatusText("Requesting a new variation from AI...");

    try {
      const userId = getUserId();
      const imageUrl = job.source.publicUrl;

      const roomTypeValue =
        overrideRoomType || roomType || job.room_type || "living";
      const styleValue =
        overrideStyle || style || job.style || "standard";

      const resp = await fetch("/api/vsai-variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomTypeValue,
          style: styleValue,
          jobId: job.id,
        }),
      });

      const json: any = await resp.json().catch(() => ({}));
      if (!resp.ok || !json.ok || !json.data?.jobId) {
        setIsProcessing(false);
        setStatusText(json.error || "Variation request failed.");
        return;
      }

      const newJobId: string = json.data.jobId;
      const newStatus: JobStatus = json.data.status || "rendering";

      setJobId(newJobId);
      setJob((prev) =>
        prev
          ? {
              ...prev,
              id: newJobId,
              status: newStatus,
              room_type: roomTypeValue,
              style: styleValue,
            }
          : {
              id: newJobId,
              userId,
              status: newStatus,
              room_type: roomTypeValue,
              style: styleValue,
              source: job.source,
            }
      );

      setHasRegenerated(true);
      setSliderValue(55);
      setIsProcessed(false);

      setStatusText("Staging new variation...");
      startPolling(newJobId, imageUrl, true);
    } catch (err: any) {
      console.error("[UI] handleRegenerateWithOptions error", err);
      setIsProcessing(false);
      setStatusText(err.message || "Variation failed.");
    }
  };

  const handleModalReStage = () => {
    handleRegenerateWithOptions(modalRoom, modalStyle);
  };

  // Purchase -> Stripe Checkout
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

  const stagedOrPreview = currentImage || previewUrl;

  // Variation navigation (true VSAI variations)
  const goToPreviousVariation = () => {
    if (totalVariations <= 1) return;
    setVariationIndex(
      (prev) => (prev - 1 + totalVariations) % totalVariations
    );
  };

  const goToNextVariation = () => {
    if (totalVariations <= 1) return;
    setVariationIndex((prev) => (prev + 1) % totalVariations);
  };

  return (
    <>
      <main className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 bg-transparent sm:px-6 lg:px-8">
          {/* Hero */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
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
                  <div className="space-y-4">
                    <div
                      className={`relative flex h-full min-h-[360px] flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 ${
                        isDragActive
                          ? "border-slate-700 bg-slate-50 shadow-inner"
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
                        <ImageIcon
                          size={32}
                          className="text-slate-500 transition-transform duration-300 group-hover:scale-110"
                        />
                        <p className="text-2xl font-semibold leading-snug text-slate-900">
                          Drag &amp; Drop
                          <span className="block text-base text-slate-500">
                            or upload files
                          </span>
                        </p>
                        <span className="rounded-full border border-slate-400 px-5 py-2 text-sm font-medium text-slate-900 transition-colors duration-200 hover:bg-slate-100">
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
                    {/* Return to Home link under drag & drop */}
                    <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                      <a
                        href="/"
                        className="underline hover:text-slate-700"
                      >
                        Return to Home
                      </a>
                    </p>
                  </div>
                ) : isProcessed && stagedOrPreview ? (
                  // Processed view with slider + overlay watermark
                  <div className="space-y-4">
                    <div
                      className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-inner shadow-slate-200/60"
                      style={{ aspectRatio: "1024 / 683" }}
                    >
                      {/* Before */}
                      <img
                        src={previewUrl || undefined}
                        alt="Before"
                        className="h-full w-full object-cover grayscale-50 brightness-90"
                      />
                      {/* After overlay (current variation) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                        }}
                      >
                        <img
                          src={stagedOrPreview || undefined}
                          alt="After"
                          className="h-full w-full object-cover transition-transform duration-500 will-change-transform"
                        />

                        {/* WATERMARK OVERLAY on rendered side only */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="select-none w-full px-6 text-center text-sm font-semibold uppercase tracking-[0.6em] text-black/60 md:text-base">
                            ICONICVIRTUAL.AI
                          </div>
                        </div>
                      </div>

                      {/* Slider vertical line */}
                      <div
                        className="absolute inset-y-0 -ml-0.5 hidden w-px bg-white/80 sm:block"
                        style={{ left: `${sliderValue}%` }}
                      />

                      {/* Slider knob */}
                      <div
                        className="pointer-events-none absolute -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg shadow-slate-400/40"
                        style={{ left: `calc(${sliderValue}% - 1.5rem)` }}
                      >
                        <Sparkles size={20} />
                      </div>

                      {/* Variation arrows (cycle REAL variations) */}
                      <div className="absolute inset-y-0 left-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 shadow-sm transition hover:scale-105 hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={goToPreviousVariation}
                          type="button"
                          disabled={totalVariations <= 1}
                        >
                          <ArrowLeft size={20} />
                        </button>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 shadow-sm transition hover:scale-105 hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={goToNextVariation}
                          type="button"
                          disabled={totalVariations <= 1}
                        >
                          <ArrowRight size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="text-center text-sm text-slate-600">
                      Drag the slider to compare the original photo with the
                      virtually staged view.
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

                    {/* Variation indicator */}
                    <div className="mt-2 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                      {totalVariations > 0 ? (
                        <>Variation {variationIndex + 1} / {totalVariations}</>
                      ) : (
                        <>First staged result</>
                      )}
                    </div>

                    {/* Actions under rendered image */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 shadow-sm transition hover:border-slate-900 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={openRegenerateModal}
                        type="button"
                        disabled={isProcessing}
                      >
                        <RefreshCw size={16} />
                        {settings.regenerateLabel}
                      </button>

                      <button
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        onClick={handlePurchaseClick}
                        disabled={isProcessing}
                      >
                        {settings.purchaseLabel}
                      </button>
                    </div>

                    {/* Back to main menu as simple link */}
                    <p className="mt-2 text-center text-xs uppercase tracking-[0.4em] text-slate-500">
                      <a href="/" className="underline hover:text-slate-700">
                        return to main menu
                      </a>
                    </p>

                    {hasRegenerated && (
                      <div className="pt-1 text-center text-xs uppercase tracking-[0.4em] text-slate-500">
                        Use the arrows to browse your staged variations.
                      </div>
                    )}
                  </div>
                ) : (
                  // Preview while processing
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
              {previewUrl && !isProcessed && (
                <div className="space-y-6">
                  {/* Room + style */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

                  {/* Declutter / Day-to-dusk toggles removed for now */}

                  {/* Main CTA */}
                  <div className="flex justify-center">
                    <button
                      className="w-1/2 max-w-[260px] rounded-2xl border border-slate-700 bg-slate-100 px-6 py-3 text-lg font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                </div>
              )}
            </section>

            {/* Right: explainer */}
            <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
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

      {/* Regenerate modal */}
      {isRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30">
            <div className="mb-4 space-y-3">
              <h3 className="text-xl font-semibold text-slate-900">
                Choose new staging options
              </h3>
              <p className="text-sm text-slate-600">
                Adjust the room and style before re-staging to preview a
                different setup.
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
                  value={modalRoom}
                  onChange={(event) => setModalRoom(event.target.value)}
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
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-500"
                onClick={() => setIsRegenerateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-slate-900"
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
