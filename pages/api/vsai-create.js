// pages/api/vsai-create.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const VSAI_API_KEY = process.env.VSAI_API_KEY;
  const VSAI_API_BASE =
    process.env.VSAI_API_BASE || "https://api.virtualstagingai.app/v1";

  if (!VSAI_API_KEY) {
    return res.status(500).json({ error: "VSAI_API_KEY not configured" });
  }

  try {
    const {
      imageUrl,
      roomType = "living",
      style = "standard",
      declutterMode = "off",
      addFurniture = true,
      resolution = "full-hd",
      addWatermark = true
    } = req.body || {};

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required" });
    }

    const body = {
      image_url: imageUrl,
      room_type: roomType,
      style: style,
      declutter_mode: declutterMode,
      add_furniture: addFurniture,
      resolution: resolution,
      wait_for_completion: true,
      add_virtually_staged_watermark: addWatermark
    };

    const resp = await fetch(`${VSAI_API_BASE}/render/create`, {
      method: "POST",
      headers: {
        Authorization: `Api-Key ${VSAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("VSAI error:", resp.status, text);
      return res.status(500).json({ error: "VSAI error", details: text });
    }

    const data = await resp.json();

    return res.status(200).json({
      renderId: data.render_id,
      resultImageUrl: data.result_image_url || null,
      removalOutput: data.removal_output || null
    });
  } catch (err) {
    console.error("vsai-create error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
