export type JobStatus =
  | "uploading"
  | "rendering"
  | "done"
  | "error"
  | "paid_rendering"
  | "paid_done";

export type Job = {
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

// In-memory job store (fine for demo / small usage)
const jobs = new Map<string, Job>();

export function saveJob(job: Job) {
  jobs.set(job.id, job);
}

export function getJob(jobId: string) {
  return jobs.get(jobId);
}
