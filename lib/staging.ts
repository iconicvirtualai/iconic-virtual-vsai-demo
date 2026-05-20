/**
 * Staging Service Layer
 * 
 * Lightweight wrapper around existing production APIs.
 * Does NOT modify API behavior or payloads.
 * Only consolidates frontend logic for reuse.
 */

export type JobStatus = "uploading" | "rendering" | "done" | "error" | "paid_rendering" | "paid_done";

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  room_type: string;
  style: string;
  renderId?: string;
  source?: {
    fileName?: string;
    storagePath?: string;
    publicUrl?: string;
  };
  watermarked?: { url: string; storagePath?: string };
  final?: { url: string; storagePath?: string };
  error?: string;
}

/**
 * Upload image to Firebase Storage via /api/upload
 * Returns public URL for use in render job
 */
export async function uploadImage(
  userId: string,
  fileName: string,
  fileBase64: string
): Promise<{ publicUrl: string; storagePath: string }> {
  const resp = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, fileName, fileBase64 }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Upload failed");
  }

  return json.data;
}

/**
 * Create a VSAI render job via /api/vsai-create
 * Returns jobId and initial status
 */
export async function createRenderJob(
  userId: string,
  imageUrl: string,
  roomType: string,
  style: string
): Promise<{ jobId: string; status: JobStatus }> {
  const resp = await fetch("/api/vsai-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, imageUrl, room_type: roomType, style }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Render start failed");
  }

  return {
    jobId: json.data.jobId,
    status: json.data.status || "rendering",
  };
}

/**
 * Poll job status via /api/jobs/[jobId]
 * Returns current job data
 */
export async function getJobStatus(jobId: string): Promise<Job> {
  const resp = await fetch(`/api/jobs/${jobId}`);
  const json = await resp.json();

  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Status check failed");
  }

  return json.data;
}

/**
 * Request a variation via /api/vsai-variation
 * Returns new result image URL
 */
export async function requestVariation(
  userId: string,
  renderId: string,
  roomType: string,
  style: string
): Promise<string | null> {
  const resp = await fetch("/api/vsai-variation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      renderId,
      room_type: roomType,
      style,
    }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.ok) {
    throw new Error(json.error || "Variation request failed");
  }

  return json?.data?.resultImageUrl || null;
}

/**
 * Initiate Stripe checkout via /api/stripe-checkout
 * Returns Stripe checkout URL
 */
export async function initiateCheckout(
  jobId: string,
  selectedIndex: number
): Promise<string> {
  const resp = await fetch("/api/stripe-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, selectedIndex }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.url) {
    throw new Error(json.error || "Stripe checkout failed");
  }

  return json.url;
}

/**
 * Generate a unique user ID for tracking jobs
 */
export function generateUserId(): string {
  return "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}
