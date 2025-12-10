// pages/api/vsai-variation.js

import fetch from "node-fetch";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

if (!VSAI_API_KEY) {
  throw new Error("VSAI_API_KEY is not set in environment variables");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      renderId,
      roomType,
      style,
      removeExistingFurniture,
      addFurniture,
      baseVariationId, // optional; can be used to branch off a specific variation
    } = req.body;

    if (!renderId) {
      return res.status(400).json({ error: "renderId is required" });
    }

    // Build config for variation
    const config = {
      type: "staging",
      output_resolution: "default",
      add_virtually_staged_watermark: true,
    };

    if (addFurniture) {
      config.add_furniture = {
        style: style || "standard",
        room_type: roomType || "living",
      };

      // optional: branch from a specific base variation
      if (baseVariationId) {
        config.add_furniture.base_variation_id = baseVariationId;
      }
    }

    if (removeExistingFurniture) {
      config.remove_furniture = {
        mode: "on",
      };
    }

    const body = {
      config,
      variation_count: 1,
      wait_for_completion: true, // wait until variation is done and result URL is ready
    };

    const vsaiRes = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(
        renderId
      )}/variations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${VSAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await vsaiRes.json();

    if (!vsaiRes.ok) {
      console.error("VSAI variation error:", data);
      return res.status(vsaiRes.status).json({
        error: data?.message || "Failed to create variation",
        raw: data,
      });
    }

    // Response example shows { variations: [ { result: { url } } ] }
    // https://docs.virtualstagingai.app/v2-api/endpoints  :contentReference[oaicite:2]{index=2}
    const variationsArray = data.variations?.items || data.variations || [];
    const variation = variationsArray[0] || null;

    const resultImageUrl = variation?.result?.url || null;
    const variationId = variation?.id || null;

    return res.status(200).json({
      renderId,
      variationId,
      resultImageUrl,
      raw: data,
    });
  } catch (err) {
    console.error("VSAI variation handler error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
