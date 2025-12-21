import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

type VariationItem = { id: string; url: string };
type Resp =
  | { ok: true; data: { renderId: string; variations: VariationItem[]; raw: any } }
  | { ok: false; error: string; raw?: any };

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
    const { renderId, room_type, style, variation_count } = req.body as {
      renderId?: string;
      room_type?: string;
      style?: string;
      variation_count?: number;
    };

    if (!renderId) {
      return res.status(400).json({ ok: false, error: "renderId is required" });
    }

    const body = {
      config: {
        type: "staging",
        output_resolution: "default",
        // Keep this OFF because you already overlay ICONICVIRTUAL.AI in the UI
        add_virtually_staged_watermark: false,
        add_furniture: {
          style: style || "standard",
          room_type: room_type || "living",
        },
      },
      variation_count: typeof variation_count === "number" ? variation_count : 4,
      wait_for_completion: true,
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

    const data = await vsaiRes.json().catch(() => ({}));

    if (!vsaiRes.ok) {
      return res.status(vsaiRes.status).json({
        ok: false,
        error: data?.message || "Failed to create variations",
        raw: data,
      });
    }

    const items =
      data?.variations?.items || data?.variations || data?.items || [];

    const variations: VariationItem[] = (Array.isArray(items) ? items : [])
      .map((v: any) => ({
        id: String(v?.id || ""),
        url: String(v?.result?.url || ""),
      }))
      .filter((v: VariationItem) => v.id && v.url);

    return res.status(200).json({
      ok: true,
      data: { renderId, variations, raw: data },
    });
  } catch (err: any) {
    console.error("[vsai-variation] error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Internal server error" });
  }
}
