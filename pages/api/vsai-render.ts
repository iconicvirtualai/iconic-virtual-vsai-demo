// pages/api/vsai-render.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

type Resp =
  | { ok: true; data: { renderId: string; status: string; outputs: string[] } }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "VSAI_API_KEY is not set on the server." });
  }

  const renderId = String(req.query.renderId || "");
  if (!renderId) {
    return res.status(400).json({ ok: false, error: "renderId is required" });
  }

  try {
    const vsaiRes = await fetch(
      `${VSAI_BASE}/render?render_id=${encodeURIComponent(renderId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Api-Key ${VSAI_API_KEY}`,
        },
      }
    );

    const data: any = await vsaiRes.json().catch(() => ({}));

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: data?.error || data?.message || "Failed to fetch render",
      });
    }

    const outputsRaw = Array.isArray(data?.outputs) ? data.outputs : [];
    // de-dupe while preserving order
    const outputs = outputsRaw.filter(
      (u: any, i: number) => typeof u === "string" && outputsRaw.indexOf(u) === i
    );

    return res.status(200).json({
      ok: true,
      data: {
        renderId,
        status: data?.status || "rendering",
        outputs,
      },
    });
  } catch (err: any) {
    console.error("[vsai-render] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
