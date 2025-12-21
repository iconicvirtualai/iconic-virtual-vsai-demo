// pages/api/vsai-variation.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_API_KEY =
  process.env.VSAI_API_KEY || process.env.VIRTUAL_STAGING_AI_API_KEY;

type VariationItem = { id: string | null; url: string | null };

type Resp =
  | {
      ok: true;
      data: {
        renderId: string;
        variationId: string | null; // first variation
        resultImageUrl: string | null; // first image url
        variationUrls: string[]; // ALL urls returned
        variations: VariationItem[]; // ALL ids + urls returned
        raw: any;
      };
    }
  | { ok: false; error: string; raw?: any };

function safeParse(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

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

  try {
    const {
      renderId,
      jobId, // ✅ accept jobId as an alias (because your UI often has job.id)
      room_type,
      style,
      removeExistingFurniture,
      addFurniture,
      baseVariationId,
      variationCount,
    } = req.body as {
      renderId?: string;
      jobId?: string;
      room_type?: string;
      style?: string;
      removeExistingFurniture?: boolean;
      addFurniture?: boolean;
      baseVariationId?: string;
      variationCount?: number;
    };

    // ✅ allow renderId OR jobId
    const resolvedRenderId = renderId || jobId;

    if (!resolvedRenderId) {
      return res.status(400).json({
        ok: false,
        error: "renderId is required (or provide jobId as an alias)",
      });
    }

    // ✅ IMPORTANT: This is how we avoid “hundreds of re-renders”
    // We generate multiple variations ONCE (default 4) and the UI can scroll them.
    const count = Math.min(Math.max(Number(variationCount || 4), 1), 8);

    // Build config for variation
    const config: any = {
      type: "staging",
      output_resolution: "default",
      // ✅ you’re adding your own watermark in the UI overlay,
      // so keep VSAI watermark OFF to avoid double watermarking.
      add_virtually_staged_watermark: false,
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
      variation_count: count,
      wait_for_completion: true,
    };

    const vsaiRes = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(
        resolvedRenderId
      )}/variations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ✅ match your other route style
          Authorization: `Api-key ${VSAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const text = await vsaiRes.text();
    const data = safeParse(text);

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: data?.message || data?.error || "Failed to create variation",
        raw: data,
      });
    }

    // Support multiple possible shapes
    const variationsArray =
      data?.variations?.items ||
      data?.variations ||
      data?.items ||
      data?.data?.variations ||
      [];

    const variations: VariationItem[] = Array.isArray(variationsArray)
      ? variationsArray.map((v: any) => ({
          id: v?.id ?? null,
          url: v?.result?.url ?? null,
        }))
      : [];

    const variationUrls = variations
      .map((v) => v.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    const first = variations[0] || null;

    return res.status(200).json({
      ok: true,
      data: {
        renderId: resolvedRenderId,
        variationId: first?.id || null,
        resultImageUrl: first?.url || null,
        variationUrls,
        variations,
        raw: data,
      },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
