// pages/index.tsx
import { useEffect, useRef, useState } from "react";

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
  source: { fileName: string; storagePath: string; publicUrl: string };
  renderId?: string;
  status: JobStatus;
  room_type: string;
  style: string;
  watermarked?: { url: string; storagePath: string };
  final?: { url: string; storagePath: string };
  error?: string;
};

type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};

function useVsaiFrontend() {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [room, setRoom] = useState("living");
  const [style, setStyle] = useState("standard");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const [userId] = useState(
    () => `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function apiFetch<T = any>(
    path: string,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    const res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    const json = (await res.json().catch(() => ({}))) as any;

    return {
      ok: res.ok && json.ok !== false,
      data: json.data,
      error: json.error,
    };
  }

  function handleFileSelect(f: File | null) {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setFilePreview(url);
    setStatus("Image selected.");
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    handleFileSelect(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] || null;
    handleFileSelect(f);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  async function fileToBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const result = r.result || "";
        const base64 = String(result).split(",")[1] || "";
        resolve(base64);
      };
      r.onerror = reject;
      r.readAsDataURL(f);
    });
  }

  function clearPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function startRender() {
    if (!file) {
      setStatus("Please upload an image first.");
      return;
    }

    clearPolling();
    setLoading(true);
    setUploading(true);
    setRendering(false);
    setStatus("Uploading image...");

    try {
      const fileBase64 = await fileToBase64(file);

      // 1) upload to Firebase "orders" via backend
      const uploadResp = await apiFetch<{ publicUrl: string; storagePath: string }>(
        "/api/upload",
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            fileName: file.name,
            fileBase64,
          }),
        }
      );

      if (!uploadResp.ok || !uploadResp.data) {
        setLoading(false);
        setUploading(false);
        setStatus(uploadResp.error || "Upload failed.");
        return;
      }

      const publicUrl = uploadResp.data.publicUrl;
      setStatus("Image uploaded. Starting AI staging...");
      setUploading(false);
      setRendering(true);

      // 2) start render
      const renderResp = await apiFetch<{ jobId: string; renderId: string; status: JobStatus }>(
        "/api/render",
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            imageUrl: publicUrl,
            room_type: room,
            style,
          }),
        }
      );

      if (!renderResp.ok || !renderResp.data) {
        setLoading(false);
        setRendering(false);
        setStatus(renderResp.error || "Render start failed.");
        return;
      }

      const newJobId = renderResp.data.jobId;
      setJobId(newJobId);
      setStatus("Staging in progress...");

      // 3) poll
      pollRef.current = setInterval(async () => {
        if (!newJobId) return;
        try {
          const statusResp = await apiFetch<Job>(`/api/jobs/${newJobId}`, {
            method: "GET",
          });
          if (!statusResp.ok || !statusResp.data) {
            setStatus(statusResp.error || "Status check failed.");
            return;
          }

          const j = statusResp.data;
          setJob(j);

          if (j.status === "done" || j.status === "paid_done") {
            clearPolling();
            setLoading(false);
            setRendering(false);
            const imgUrl = j.final?.url || j.watermarked?.url || "";
            if (imgUrl) setStatus("Staging complete.");
          } else if (j.status === "error") {
            clearPolling();
            setLoading(false);
            setRendering(false);
            setStatus(j.error || "Render failed.");
          } else {
            setStatus("Staging in progress...");
          }
        } catch {
          // ignore transient poll errors
        }
      }, 2500);
    } catch (e: any) {
      setLoading(false);
      setUploading(false);
      setRendering(false);
      setStatus(e?.message || "Unexpected error during staging.");
    }
  }

  async function checkout() {
    if (!jobId) {
      setStatus("No job to checkout.");
      return;
    }

    setLoading(true);
    setStatus("Processing final image...");

    try {
      const resp = await apiFetch<{ downloadUrl: string; job: Job }>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ jobId }),
      });

      if (!resp.ok || !resp.data) {
        setLoading(false);
        setStatus(resp.error || "Checkout failed.");
        return;
      }

      setJob(resp.data.job);
      setLoading(false);

      const url = resp.data.downloadUrl;
      setStatus("Download starting...");

      const a = document.createElement("a");
      a.href = url;
      a.download = "virtually-staged.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      setLoading(false);
      setStatus(e?.message || "Checkout failed.");
    }
  }

  return {
    file,
    filePreview,
    room,
    style,
    job,
    status,
    loading,
    uploading,
    rendering,
    setRoom,
    setStyle,
    handleInputChange,
    handleDrop,
    handleDragOver,
    startRender,
    checkout,
  };
}

const HomePage = () => {
  const {
    file,
    filePreview,
    room,
    style,
    job,
    status,
    loading,
    uploading,
    rendering,
    setRoom,
    setStyle,
    handleInputChange,
    handleDrop,
    handleDragOver,
    startRender,
    checkout,
  } = useVsaiFrontend();

  const dragActive = false; // you can wire proper drag state if needed

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Replace the markup below with your Builder-generated JSX if you prefer.
            Keep the handlers & ids wired the same way. */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: upload + controls */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Virtually Stage Your Space
              </h2>
              <p className="text-slate-600">
                Upload a photo and watch AI transform your room. See different styles before you decide.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-white"
              }`}
            >
              <input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
              {filePreview ? (
                <div className="p-8">
                  <img
                    src={filePreview}
                    alt="preview"
                    className="w-full h-64 object-cover rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("file")?.click()}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change image
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="file"
                  className="flex flex-col items-center justify-center p-12 cursor-pointer"
                >
                  <svg
                    className="h-12 w-12 text-slate-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-slate-600 font-medium">
                    Drag and drop your photo
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    or click to browse
                  </p>
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Room Type
                </label>
                <select
                  id="vsai-room-type"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="living">Living Room</option>
                  <option value="bed">Bedroom</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="dining">Dining</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="home_office">Home Office</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="kids_room">Kids Room</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Style
                </label>
                <select
                  id="vsai-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="modern">Modern</option>
                  <option value="scandinavian">Scandinavian</option>
                  <option value="industrial">Industrial</option>
                  <option value="mid-century modern">Mid-Century Modern</option>
                  <option value="coastal">Coastal</option>
                  <option value="american">American</option>
                  <option value="southwestern">Southwestern</option>
                  <option value="farmhouse">Farmhouse</option>
                  <option value="luxury">Luxury</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={startRender}
              disabled={!file || loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-base font-semibold rounded-lg"
            >
              {uploading
                ? "Uploading..."
                : rendering
                ? "Staging..."
                : "Stage Image"}
            </button>

            {status && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Status:</span> {status}
              </p>
            )}
          </div>

          {/* RIGHT: preview */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
            </div>

            <div className="p-6">
              {!job || (job.status !== "done" && job.status !== "paid_done") ? (
                <div className="h-96 rounded-lg border border-slate-200 bg-slate-50 grid place-items-center text-slate-500">
                  {rendering ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-sm font-medium">
                        AI is staging your space...
                      </p>
                    </div>
                  ) : (
                    <p className="text-center text-sm">
                      Upload an image and click{" "}
                      <span className="font-semibold">Stage Image</span> to see
                      your room transformed.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img
                      id="vsai-preview-img"
                      src={job.final?.url || job.watermarked?.url || ""}
                      alt="staged"
                      className="w-full h-96 object-cover"
                    />
                    {!job.final?.url && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/30 text-white text-xs font-semibold px-3 py-1 rounded">
                          Watermarked Preview
                        </div>
                      </div>
                    )}
                  </div>

                  {!job.final?.url ? (
                    <button
                      type="button"
                      onClick={checkout}
                      disabled={loading}
                      className="w-full h-11 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold rounded-lg"
                    >
                      {loading ? "Processing..." : "Download Full Resolution"}
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        ✓ Full resolution image unlocked. Download available
                        above.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
