// pages/api/vsai-variation.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

// Helper to call the VSAI API
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
    // ignore parse error; json stays {}
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

  // Log what we got so you can see it in Vercel logs
  console.log("[vsai-variation] incoming body:", req.body);

  const {
    jobId,
    originalJobId,
    userId,
    imageUrl,
    room_type,
    style,
    declutter,
    day_to_dusk,
  } = req.body as {
    jobId?: string;
    originalJobId?: string;
    userId?: string;
    imageUrl?: string;
    room_type?: string;
    style?: string;
    declutter?: boolean;
    day_to_dusk?: boolean;
  };

  // We really just need the image URL and some config for VSAI
  if (!imageUrl) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing imageUrl for variation" });
  }

  // Normalize room/style
  const rt = (room_type || "living").trim();
  const st = (style || "standard").trim();

  // Parent job (used for free variations if VSAI supports it)
  const parentId = originalJobId || jobId || null;

  // Build VSAI payload
  const payload: any = {
    image_url: imageUrl,
    room_type: rt,
    style: st,
    wait_for_completion: false,
    add_virtually_staged_watermark: true,
  };

  // Optional modifiers
  if (declutter === true) payload.declutter = true;
  if (day_to_dusk === true) payload.day_to_dusk = true;

  // If VSAI supports referencing an earlier render, pass it along
  if (parentId) {
    // NOTE: Adjust this key if VSAI docs specify a different name
    payload.parent_render_id = parentId;
  }

  // Demo mode: no API key configured – just fake a job id so the UI doesn't break
  if (!VSAI_API_KEY) {
    const fakeId = `variation-${Date.now()}`;
    console.log(
      "[vsai-variation] no VSAI_API_KEY, returning demo job id:",
      fakeId
    );
    return res.status(200).json({
      ok: true,
      data: {
        jobId: fakeId,
        status: "rendering",
        basedOnJobId: parentId,
      },
    });
  }

  try {
    // Call the real VSAI API
    const json = await callVsai("/render/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log("[vsai-variation] VSAI /render/create response:", json);

    const renderId =
      json.render_id || json.id || json.renderId || `variation-${Date.now()}`;
    const status: string = json.status || "rendering";

    return res.status(200).json({
      ok: true,
      data: {
        jobId: renderId,
        status,
        basedOnJobId: parentId,
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
