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

const dragDropPatternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="none"/><path d="M14 0v28M0 14h28" stroke="%230f172a" stroke-width="0.5" opacity="0.2"/></svg>`;
const DRAG_DROP_PATTERN = `data:image/svg+xml,${encodeURIComponent(
  dragDropPatternSvg
)}`;


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  // Real variation list from VSAI (not fake filters)
  const [variationUrls, setVariationUrls] = useState<string[]>([]);
  const [currentVariationIndex, setCurrentVariationIndex] =
    useState<number>(0);

  // Regenerate modal
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [modalRoomType, setModalRoomType] = useState<string>("living");
  const [modalStyle, setModalStyle] = useState<string>("standard");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userIdRef = useRef<string | null>(null);
  const originalImageUrlRef = useRef<string | null>(null); // remembers original upload URL

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

  // Shared polling function for initial render AND regenerations
  const startPolling = (
    jobIdToPoll: string,
    fallbackImageUrl: string,
    options?: { resetVariations?: boolean; appendVariation?: boolean }
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

        // Merge new job data with the old one so we keep source.publicUrl
        setJob((prev) => {
          const merged: Job = {
            ...(prev || ({} as Job)),
            ...j,
            source: j.source || prev?.source,
          };
          return merged;
        });

        if (j.status === "done" || j.status === "paid_done") {
          clearPolling();
          const imgUrl =
            j.final?.url || j.watermarked?.url || fallbackImageUrl;

          setStagedUrl(imgUrl);
          setIsProcessing(false);
          setIsProcessed(true);
          setStatusText("Staging complete.");

          // Maintain list of variations for the arrows
          setVariationUrls((prev) => {
            let next = prev;

            if (options?.resetVariations || prev.length === 0) {
              next = [imgUrl];
              setCurrentVariationIndex(0);
            } else if (options?.appendVariation) {
              if (!prev.includes(imgUrl)) {
                next = [...prev, imgUrl];
                setCurrentVariationIndex(next.length - 1);
              }
            }

            return next;
          });
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
  };

  // Slider "after" URL
  const currentFinalUrl = useMemo(() => {
    if (variationUrls.length > 0) {
      return variationUrls[
        Math.min(
          variationUrls.length - 1,
          Math.max(0, currentVariationIndex)
        )
      ];
    }
    return stagedUrl || previewUrl;
  }, [variationUrls, currentVariationIndex, stagedUrl, previewUrl]);

  const handleNewFile = (f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      setStatusText("File too large. Please upload an image limited to 10MB.");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
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
      originalImageUrlRef.current = imageUrl; // remember original upload
      setStatusText("Image uploaded. Starting AI staging...");

      // 2) Create VSAI render (preview / watermarked)
      const renderResp = await fetch("/api/vsai-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomType,
          style,
          // declutter/day_to_dusk removed for now
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
      startPolling(newJobId, imageUrl, { resetVariations: true });
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

  // Open regenerate modal (do NOT hit VSAI yet)
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

  const closeRegenerateModal = () => {
    setIsRegenerateModalOpen(false);
  };

  // Actual regenerate -> calls /api/vsai-variation
  const handleRegenerateClick = async (
    overrideRoomType?: string,
    overrideStyle?: string
  ) => {
    const imageUrl =
      job?.source?.publicUrl || originalImageUrlRef.current || null;

    if (!imageUrl) {
      setStatusText("No original job/image to regenerate.");
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    setIsProcessed(false);
    setStatusText("Requesting a new variation from AI...");

    try {
      const userId = getUserId();

      const roomTypeValue =
        overrideRoomType || roomType || job?.room_type || "living";
      const styleValue =
        overrideStyle || style || job?.style || "standard";

      const resp = await fetch("/api/vsai-variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          imageUrl,
          room_type: roomTypeValue,
          style: styleValue,
          jobId: job?.id,
        }),
      });

      const json: any = await resp.json().catch(() => ({}));
      console.log("[UI] /api/vsai-variation response", resp.status, json);

      if (!resp.ok || !json.ok || !json.data?.jobId) {
        setIsProcessing(false);
        setStatusText(json.error || "Variation request failed.");
        return;
      }

      const newJobId: string = json.data.jobId;
      const newStatus: JobStatus = json.data.status || "rendering";

      setJob((prev) =>
        prev
          ? {
              ...prev,
              id: newJobId,
              status: newStatus,
              room_type: roomTypeValue,
              style: styleValue,
              source: {
                ...(prev.source || {}),
                publicUrl: imageUrl,
              },
            }
          : {
              id: newJobId,
              userId,
              status: newStatus,
              room_type: roomTypeValue,
              style: styleValue,
              source: {
                publicUrl: imageUrl,
              },
            }
      );

      setJobId(newJobId);
      setHasRegenerated(true);
      setSliderValue(55);
      setStatusText("Staging new variation...");
      startPolling(newJobId, imageUrl, { appendVariation: true });
    } catch (err: any) {
      console.error("[UI] handleRegenerateClick error", err);
      setIsProcessing(false);
      setStatusText(err.message || "Variation failed.");
    }
  };

  const handleModalReStage = async () => {
    setRoomType(modalRoomType);
    setStyle(modalStyle);
    setIsRegenerateModalOpen(false);
    await handleRegenerateClick(modalRoomType, modalStyle);
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

  const handlePrevVariation = () => {
    if (variationUrls.length <= 1) return;
    setCurrentVariationIndex((prev) =>
      prev === 0 ? variationUrls.length - 1 : prev - 1
    );
  };

  const handleNextVariation = () => {
    if (variationUrls.length <= 1) return;
    setCurrentVariationIndex((prev) =>
      prev === variationUrls.length - 1 ? 0 : prev + 1
    );
  };

  const stagedOrPreview = currentFinalUrl || previewUrl;

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
            {/* Left: upload + preview */}
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

                    {/* Return to home link OUTSIDE the box */}
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
                        />

                        {/* WATERMARK overlay on staged side */}
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className="select-none text-3xl md:text-5xl font-semibold tracking-[0.4em] text-slate-900/65 mix-blend-multiply">
                            ICONICVIRTUAL.AI
                          </span>
                        </div>
                      </div>

                      {/* Slider line */}
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

                      {/* Variation arrows (cycle REAL VSAI variations) */}
                      <div className="absolute inset-y-0 left-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                          onClick={handlePrevVariation}
                          type="button"
                          disabled={variationUrls.length <= 1}
                        >
                          <ArrowLeft size={20} />
                        </button>
                      </div>
                      <div className="absolute inset-y-0 right-4 flex items-center">
                        <button
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-400 bg-slate-100 text-slate-900 transition hover:border-slate-600"
                          onClick={handleNextVariation}
                          type="button"
                          disabled={variationUrls.length <= 1}
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

                    {/* After render: ONLY these options */}
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
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-slate-900 transition hover:border-slate-900 disabled:opacity-50"
                        type="button"
                        onClick={handlePurchaseClick}
                        disabled={isProcessing}
                      >
                        {settings.purchaseLabel}
                      </button>
                    </div>

                    {/* Back to main menu as a LINK (no chip) */}
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

              {/* Controls */}
              {previewUrl && (
                <div className="space-y-6">
                  {/* BEFORE render: show controls */}
                  {!isProcessed && (
                    <>
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

                      {/* Main CTA */}
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
                    </>
                  )}

                  {/* Tiny hint after any regeneration */}
                  {hasRegenerated && isProcessed && (
                    <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
                      Use the arrows to explore your staged variations.
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Right: explainer */}
            <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/60">
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Key Features
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>AI staged photos in 1–3 minutes.</li>
                <li>File size impacts render speed.</li>
                <li>Real-time Before &amp; After Reveal.</li>
                <li>Different Style Variations.</li>
                <li>Furnished results by room and style selectors.</li>
                <li>
                  Auto-crop, lighting, and mood adjustments with every request.
                </li>
              </ul>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                <p className="font-semibold text-slate-900">Tips</p>
                <p className="mt-1 text-slate-600">
                  Use high-resolution photos with neutral/bright lighting for
                  best results.
                </p>
                <p className="mt-1 text-slate-600">
                  For fastest results, limit file sizes to 2MB.
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
                  value={modalRoomType}
                  onChange={(event) => setModalRoomType(event.target.value)}
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
