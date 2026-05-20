// pages/api/vsai-options.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const VSAI_API_KEY = process.env.VSAI_API_KEY;
  const VSAI_API_BASE =
    process.env.VSAI_API_BASE || "https://api.virtualstagingai.app/v1";

  if (!VSAI_API_KEY) {
    // Return fallback options if API key not configured
    return res.status(200).json({
      ok: true,
      data: {
        room_types: ["living", "bed", "kitchen", "dining", "home_office"],
        styles: ["standard", "modern", "scandinavian", "luxury", "coastal", "farmhouse", "bohemian", "industrial"]
      }
    });
  }

  try {
    const resp = await fetch(`${VSAI_API_BASE}/options`, {
      method: "GET",
      headers: {
        Authorization: `Api-Key ${VSAI_API_KEY}`
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("VSAI options error:", resp.status, text);
      return res.status(500).json({ error: "VSAI options error" });
    }

    const data = await resp.json();
    // data: { styles: string[], roomTypes: string[] }

    return res.status(200).json({
      ok: true,
      data
    });
  } catch (err) {
    console.error("vsai-options error:", err);
    // Return fallback options on error
    return res.status(200).json({
      ok: true,
      data: {
        room_types: ["living", "bed", "kitchen", "dining", "home_office"],
        styles: ["standard", "modern", "scandinavian", "luxury", "coastal", "farmhouse", "bohemian", "industrial"]
      }
    });
  }
}
