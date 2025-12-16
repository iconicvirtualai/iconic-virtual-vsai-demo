// pages/api/vsai-variation.ts
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const {
    jobId,
    userId,
    imageUrl,
    room_type,
    style,
    declutter,
    day_to_dusk,
  } = req.body as {
    jobId?: string;
    userId?: string;
    imageUrl?: string;
    room_type?: string;
    style?: string;
    declutter?: boolean;
    day_to_dusk?: boolean;
  };

  if (!userId || !imageUrl) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing userId or imageUrl" });
  }

  const rt = room_type || "living";
  const st = style || "standard";

  // payload is `any` so we can attach whatever VSAI supports
  const payload: any = {
    image_url: imageUrl,
    room_type: rt,
    style: st,
    wait_for_completion: false,
    add_virtually_staged_watermark: true,
  };

  // optional flags; VSAI will ignore unknown ones
  if (declutter) payload.declutter = true;
  if (day_to_dusk) payload.day_to_dusk = true;

  // if VSAI ever supports free variations by parent id, pass it along
  if (jobId) payload.parent_render_id = jobId;

  // Demo mode (no VSAI key configured)
  if (!VSAI_API_KEY) {
    const fakeId = `variation-${Date.now()}`;
    return res.status(200).json({
      ok: true,
      data: {
        jobId: fakeId,
        status: "rendering",
        basedOnJobId: jobId || null,
      },
    });
  }

  try {
    const json = await callVsai("/render/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const renderId =
      json.render_id || json.id || json.renderId || `variation-${Date.now()}`;
    const status: string = json.status || "rendering";

    return res.status(200).json({
      ok: true,
      data: {
        jobId: renderId,
        status,
        basedOnJobId: jobId || null,
      },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to request variation",
    });
  }
}
