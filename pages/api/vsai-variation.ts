import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

type Resp =
  | { ok: true; data: { variationId: string | null; resultImageUrl: string | null; raw: any } }
  | { ok: false; error: string; raw?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "VSAI_API_KEY is not set on the server." });
  }

  try {
    const {
      renderId,
      room_type,
      style,
      removeExistingFurniture,
      addFurniture,
      baseVariationId,
    } = req.body as {
      renderId?: string;
      room_type?: string;
      style?: string;
      removeExistingFurniture?: boolean;
      addFurniture?: boolean;
      baseVariationId?: string;
    };

    if (!renderId) {
      return res.status(400).json({ ok: false, error: "renderId is required" });
    }

    // Build config for variation
    const config: any = {
      type: "staging",
      output_resolution: "default",
      add_virtually_staged_watermark: true,
    };

    const shouldAddFurniture = addFurniture !== false; // default true
    if (shouldAddFurniture) {
      config.add_furniture = {
        style: style || "standard",
        room_type: room_type || "living",
      };

      if (baseVariationId) {
        config.add_furniture.base_variation_id = baseVariationId;
      }
    }

    if (removeExistingFurniture) {
      config.remove_furniture = { mode: "on" };
    }

    const body = {
      config,
      variation_count: 1,
      wait_for_completion: true,
    };

    const vsaiRes = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(renderId)}/variations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${VSAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await vsaiRes.json().catch(() => ({}));

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: data?.message || "Failed to create variation",
        raw: data,
      });
    }

    const variationsArray = data?.variations?.items || data?.variations || [];
    const variation = variationsArray[0] || null;

    const resultImageUrl = variation?.result?.url || null;
    const variationId = variation?.id || null;

    return res.status(200).json({
      ok: true,
      data: { variationId, resultImageUrl, raw: data },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal server error" });
  }
}
