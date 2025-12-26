// pages/api/vsai-create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebaseAdmin";

const VSAI_BASE = "https://api.virtualstagingai.app/v1";
const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

type Resp =
  | {
      ok: true;
      data: {
        jobId: string;
        status: string;
      };
    }
  | { ok: false; error: string };

async function callVsai(path: string, init?: RequestInit) {
  if (!VSAI_API_KEY) throw new Error("VSAI_API_KEY is not configured");

  const resp = await fetch(`${VSAI_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Api-Key ${VSAI_API_KEY}`, // ✅ consistent
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const text = await resp.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { _rawText: text };
  }

  if (!resp.ok) {
    const message = json.error || json.message || `VSAI error ${resp.status}`;
    throw new Error(message);
  }

  return json;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { userId, imageUrl, room_type, style } = req.body as {
    userId?: string;
    imageUrl?: string;
    room_type?: string;
    style?: string;
  };

  if (!userId || !imageUrl) {
    return res.status(400).json({ ok: false, error: "Missing userId or imageUrl" });
  }

  if (!VSAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "VSAI_API_KEY is not configured" });
  }

  const rt = room_type || "living";
  const st = style || "standard";

  // ✅ IMPORTANT: watermark disabled here
  const payload: any = {
    image_url: imageUrl,
    room_type: rt,
    style: st,
    wait_for_completion: false,
    add_virtually_staged_watermark: false,
  };

  try {
    const json = await callVsai("/render/create", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const renderId =
      json.render_id || json.id || json.renderId || `render-${Date.now()}`;
    const status: string = json.status || "rendering";

    // ✅ Persist the project immediately so it doesn't disappear if user leaves
    // Collection: jobs (doc id = renderId)
    await db
      .collection("jobs")
      .doc(String(renderId))
      .set(
        {
          id: String(renderId),
          renderId: String(renderId),
          userId: String(userId),
          status,
          room_type: rt,
          style: st,
          source: {
            publicUrl: String(imageUrl),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return res.status(200).json({
      ok: true,
      data: {
        jobId: String(renderId),
        status,
      },
    });
  } catch (err: any) {
    console.error("[vsai-create] error:", err);
    return res.status(500).json({
      ok: false,
      error: err?.message || "Failed to start render",
    });
  }
}
