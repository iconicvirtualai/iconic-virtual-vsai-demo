// pages/api/jobs/[jobId].ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

async function callVsai(path: string, init?: RequestInit) {
  if (!VSAI_API_KEY) {
    throw new Error("VSAI_API_KEY is not configured");
  }

  const resp = await fetch(`${VSAI_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Api-key ${VSAI_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await resp.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // ignore parse error
  }

  if (!resp.ok) {
    const message =
      json.error || json.message || `VSAI error ${resp.status}`;
    throw new Error(message);
  }

  return json;
}

function extractOutputUrl(output: any): string | undefined {
  if (!output) return;
  if (typeof output === "string" && output.trim()) return output;

  const keys = [
    "url",
    "image_url",
    "result_image_url",
    "output_url",
    "download_url",
    "public_url",
  ];

  for (const key of keys) {
    const value = (output as any)[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (Array.isArray(output.outputs) && output.outputs.length > 0) {
    const nested = extractOutputUrl(output.outputs[0]);
    if (nested) return nested;
  }

  if (Array.isArray(output.media) && output.media.length > 0) {
    const nested = extractOutputUrl(output.media[0]);
    if (nested) return nested;
  }

  return;
}

function pickFirstOutputUrl(outputs: any[]): string | undefined {
  if (!Array.isArray(outputs)) return;
  for (const output of outputs) {
    const url = extractOutputUrl(output);
    if (url) return url;
  }
  return;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { jobId } = req.query;

  if (!jobId || typeof jobId !== "string") {
    return res.status(400).json({ ok: false, error: "Missing jobId" });
  }

  // Demo mode when there is no VSAI key configured
  if (!VSAI_API_KEY) {
    const demoUrl =
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800";
    return res.status(200).json({
      ok: true,
      data: {
        id: jobId,
        userId: null,
        status: "done",
        room_type: "living",
        style: "standard",
        source: { publicUrl: "" },
        watermarked: { url: demoUrl },
      },
    });
  }

  try {
    const json = await callVsai(
      `/render?render_id=${encodeURIComponent(jobId)}`
    );

    const status: string = json.status || json.state || "rendering";
    const outputs: any[] = json.outputs || [];
    const firstUrl = pickFirstOutputUrl(outputs);

    return res.status(200).json({
      ok: true,
      data: {
        id: jobId,
        userId: json.user_id || null,
        status,
        room_type: json.room_type || "living",
        style: json.style || "standard",
        source: {
          publicUrl: json.image_url || json.input_image_url || "",
        },
        watermarked: firstUrl ? { url: firstUrl } : undefined,
      },
    });
  } catch (err: any) {
    console.error("[jobs] error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to get job status",
    });
  }
}
