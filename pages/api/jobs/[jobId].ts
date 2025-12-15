import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

function pickFirstOutputUrl(outputs: any[]): string | null {
  if (!Array.isArray(outputs) || outputs.length === 0) return null;
  const first = outputs[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    if (typeof first.url === "string") return first.url;
    if (typeof first.image_url === "string") return first.image_url;
    if (typeof first.result_image_url === "string") return first.result_image_url;
  }
  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "VSAI_API_KEY not configured" });
  }

  const { jobId } = req.query;
  const renderId = Array.isArray(jobId) ? jobId[0] : jobId;

  if (!renderId || typeof renderId !== "string") {
    return res.status(400).json({ ok: false, error: "Missing jobId" });
  }

  try {
    const vsaiRes = await fetch(
      `${VSAI_BASE}/render?render_id=${encodeURIComponent(renderId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Api-key ${VSAI_API_KEY}`,
        },
      }
    );

    const json = (await vsaiRes.json().catch(() => ({}))) as any;

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: json.error || "VirtualStagingAI status failed",
      });
    }

    const status = json.status || json.state || "rendering";
    const outputs = json.outputs || [];
    const url = pickFirstOutputUrl(outputs);

    const job: any = {
      id: renderId,
      userId: "",
      source: { fileName: "", storagePath: "", publicUrl: "" },
      status,
      room_type: json.room_type || "",
      style: json.style || "",
    };

    if (url) {
      job.watermarked = { url, storagePath: "" };
    }

    return res.status(200).json({ ok: true, data: job });
  } catch (e: any) {
    console.error("[api/jobs] error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Status error" });
  }
}
