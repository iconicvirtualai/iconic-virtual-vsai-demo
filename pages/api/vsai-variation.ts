// pages/api/vsai-variation.ts
import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

type Resp =
  | {
      ok: true;
      data: {
        variationId: string | null;
        resultImageUrl: string | null;
        raw: any;
      };
    }
  | { ok: false; error: string; raw?: any };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractFirstUrl(payload: any): { variationId: string | null; url: string | null } {
  if (!payload || typeof payload !== "object") return { variationId: null, url: null };

  // Most common shapes we’ve seen:
  // data.variations.items[0].result.url
  // data.variations[0].result.url
  // data.items[0].result.url
  // data[0].result.url
  const candidates: any[] = [];

  if (Array.isArray(payload?.variations?.items)) candidates.push(...payload.variations.items);
  if (Array.isArray(payload?.variations)) candidates.push(...payload.variations);
  if (Array.isArray(payload?.items)) candidates.push(...payload.items);
  if (Array.isArray(payload)) candidates.push(...payload);

  const first = candidates[0] || null;
  const variationId = first?.id || payload?.variation_id || payload?.id || null;

  // Possible URL locations
  const url =
    first?.result?.url ||
    first?.result_url ||
    first?.url ||
    payload?.result?.url ||
    payload?.result_url ||
    payload?.url ||
    null;

  return { variationId, url };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Resp>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "VSAI_API_KEY is not set on the server." });
  }

  try {
    const { renderId, room_type, style, removeExistingFurniture, addFurniture, baseVariationId } =
      req.body as {
        userId?: string;
        renderId?: string;
        room_type?: string;
        style?: string;
        removeExistingFurniture?: boolean;
        addFurniture?: boolean; // default true
        baseVariationId?: string;
      };

    if (!renderId) {
      return res.status(400).json({ ok: false, error: "renderId is required" });
    }

    // Build config for variation
    const config: any = {
      type: "staging",
      output_resolution: "default",
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

    // 1) Create the variation
    const createResp = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(renderId)}/variations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${VSAI_API_KEY}`,
        },
        body: JSON.stringify({
          config,
          variation_count: 1,
          wait_for_completion: true, // still might return before url is ready
        }),
      }
    );

    const createText = await createResp.text();
    let createJson: any = {};
    try {
      createJson = createText ? JSON.parse(createText) : {};
    } catch {
      createJson = { _rawText: createText };
    }

    if (!createResp.ok) {
      return res.status(createResp.status).json({
        ok: false,
        error: createJson?.message || "Failed to create variation",
        raw: createJson,
      });
    }

    let { variationId, url } = extractFirstUrl(createJson);

    // 2) If we still don’t have a URL, poll VSAI for the variation result
    // (Sometimes VSAI creates the variation but result.url populates a second later.)
    if (!url) {
      const maxAttempts = 12; // ~24 seconds
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await sleep(2000);

        const listResp = await fetch(
          `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(renderId)}/variations`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Api-Key ${VSAI_API_KEY}`,
            },
          }
        );

        const listText = await listResp.text();
        let listJson: any = {};
        try {
          listJson = listText ? JSON.parse(listText) : {};
        } catch {
          listJson = { _rawText: listText };
        }

        if (listResp.ok) {
          // Try to find the same variation first, otherwise take the newest
          const listItems: any[] = [];
          if (Array.isArray(listJson?.variations?.items)) listItems.push(...listJson.variations.items);
          else if (Array.isArray(listJson?.variations)) listItems.push(...listJson.variations);
          else if (Array.isArray(listJson?.items)) listItems.push(...listJson.items);
          else if (Array.isArray(listJson)) listItems.push(...listJson);

          const match =
            (variationId ? listItems.find((v) => v?.id === variationId) : null) ||
            listItems[0] ||
            null;

          variationId = variationId || match?.id || null;
          url = match?.result?.url || match?.result_url || match?.url || null;

          if (url) {
            // Return with the listJson as "raw" since it’s the one containing the final URL
            return res.status(200).json({
              ok: true,
              data: { variationId, resultImageUrl: url, raw: listJson },
            });
          }
        }
      }
    }

    // 3) Return whatever we have (url may still be null)
    return res.status(200).json({
      ok: true,
      data: { variationId: variationId || null, resultImageUrl: url || null, raw: createJson },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "Internal server error" });
  }
}
