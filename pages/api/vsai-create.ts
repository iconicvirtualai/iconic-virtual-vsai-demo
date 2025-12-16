// pages/api/vsai-create.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

// Small helper to call VSAI safely
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
    // ignore parse error, json stays {}
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
    userId,
    imageUrl,
    room_type,
    style,
    declutter,
    day_to_dusk,
  } = req.body as {
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

  // Make this `any` so we can safely add add_furniture / declutter, etc.
  const payload: any = {
    image_url: imageUrl,
    room_type: rt,
    style: st,
    wait_for_completion: false,
    add_virtually_staged_watermark: true,
  };

  // Optional flags — VSAI will ignore unknown fields it doesn’t support
  if (declutter) {
    // if VSAI expects a different key, we can rename here later
    payload.declutter = true;
  }
  if (day_to_dusk) {
    payload.day_to_dusk = true;
  }

  // If you wanted to use their newer "add_furniture" style config, you can
  // also safely attach it here without upsetting TypeScript:
  payload.add_furniture = {
    room_type: rt,
    style: st,
  };

  // Demo mode (no key) – still responds so frontend doesn’t explode
  if (!VSAI_API_KEY) {
    const fakeJobId = `demo-${Date.now()}`;
    return res.status(200).json({
      ok: true,
      data: {
        jobId: fakeJobId,
        status: "rendering",
      },
    });
  }

  try {
    const json = await callVsai("/render/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const renderId =
      json.render_id || json.id || json.renderId || `job-${Date.now()}`;
    const status: string = json.status || "rendering";

    return res.status(200).json({
      ok: true,
      data: {
        jobId: renderId,
        status,
      },
    });
  } catch (err: any) {
    console.error("[vsai-create] error:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to start render",
    });
  }
}
