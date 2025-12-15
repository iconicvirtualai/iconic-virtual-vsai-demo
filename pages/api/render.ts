import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "VSAI_API_KEY not configured" });
  }

  const { userId, imageUrl, room_type, style } = req.body || {};
  if (!userId || !imageUrl || !room_type || !style) {
    return res.status(400).json({
      ok: false,
      error: "Missing userId, imageUrl, room_type or style",
    });
  }

  try {
    const payload = {
      image_url: imageUrl,
      room_type,
      style,
      wait_for_completion: false,
      add_virtually_staged_watermark: "true",
    };

    const vsaiRes = await fetch(`${VSAI_BASE}/render/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-key ${VSAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const json = (await vsaiRes.json().catch(() => ({}))) as any;

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: json.error || "VirtualStagingAI render failed",
      });
    }

    const renderId = json.render_id || json.id || json.renderId;
    const status = json.status || json.state || "rendering";

    if (!renderId) {
      return res
        .status(500)
        .json({ ok: false, error: "Missing render_id from VSAI response" });
    }

    return res.status(200).json({
      ok: true,
      data: {
        jobId: renderId,
        renderId,
        status,
      },
    });
  } catch (e: any) {
    console.error("[api/render] error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Render error" });
  }
}
