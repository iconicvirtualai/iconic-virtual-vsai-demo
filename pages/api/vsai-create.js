// pages/api/vsai-create.js
import fetch from "node-fetch";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!VSAI_API_KEY) {
    return res.status(500).json({ error: "VSAI_API_KEY not configured" });
  }

  try {
    const {
      imageUrl,
      roomType,
      style,
      removeExistingFurniture,
      addFurniture,
    } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const config = {
      type: "staging",
      output_resolution: "default",
      add_virtually_staged_watermark: true,
    };

    if (addFurniture) {
      config.add_furniture = {
        room_type: roomType || "living",
        style: style || "standard",
      };
    }

    if (removeExistingFurniture) {
      config.remove_furniture = {
        mode: "on",
      };
    }

    const body = {
      config,
      image_url: imageUrl,
      variation_count: 1,
      wait_for_completion: true,
    };

    const vsaiRes = await fetch("https://api.virtualstagingai.app/v2/renders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Key ${VSAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await vsaiRes.json();

    if (!vsaiRes.ok) {
      console.error("VSAI create error:", data);
      return res
        .status(vsaiRes.status)
        .json({ error: data?.message || "Failed to create render" });
    }

    const renderId = data.id;
    const variation =
      data?.variations?.items?.[0] || data?.variations?.[0] || null;
    const resultImageUrl = variation?.result?.url || null;
    const variationId = variation?.id || null;

    return res.status(200).json({
      renderId,
      variationId,
      resultImageUrl,
    });
  } catch (err) {
    console.error("vsai-create error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
