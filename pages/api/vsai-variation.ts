// pages/api/vsai-variation.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

type Resp =
  | { ok: true; data: { jobId: string; status: "queued" | "rendering" | "done" } }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "VSAI_API_KEY is not set on the server." });
  }

  const { renderId, room_type, style } = req.body as {
    renderId?: string;
    room_type?: string;
    style?: string;
  };

  if (!renderId) {
    return res.status(400).json({ ok: false, error: "renderId is required" });
  }

  try {
    const body = {
      wait_for_completion: false, // we'll poll /api/vsai-render
      switch_to_queued_immediately: true,
      add_virtually_staged_watermark: false,
      roomType: room_type || "living",
      style: style || "standard",
    };

    const vsaiRes = await fetch(
      `${VSAI_BASE}/render/create-variation?render_id=${encodeURIComponent(
        renderId
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${VSAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data: any = await vsaiRes.json().catch(() => ({}));

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: data?.error || data?.message || "Failed to create variation",
      });
    }

    // v1 returns render_id
    return res.status(200).json({
      ok: true,
      data: {
        jobId: data?.render_id || renderId,
        status: "rendering",
      },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
