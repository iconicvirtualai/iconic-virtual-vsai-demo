import type { NextApiRequest, NextApiResponse } from "next";

const VSAI_API_KEY = process.env.VSAI_API_KEY;

type Resp =
  | { ok: true; data: { url: string | null; raw: any } }
  | { ok: false; error: string; raw?: any };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Resp>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!VSAI_API_KEY) {
    return res.status(500).json({ ok: false, error: "VSAI_API_KEY missing" });
  }

  const renderId = req.query.renderId;
  const variationId = req.query.variationId;

  if (typeof renderId !== "string" || typeof variationId !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "renderId and variationId are required" });
  }

  try {
    // Most common list endpoint (we keep parsing flexible)
    const listRes = await fetch(
      `https://api.virtualstagingai.app/v2/renders/${encodeURIComponent(
        renderId
      )}/variations`,
      {
        method: "GET",
        headers: {
          Authorization: `Api-Key ${VSAI_API_KEY}`,
        },
      }
    );

    const data = await listRes.json().catch(() => ({}));

    const items = data?.variations?.items || data?.variations || data?.items || [];
    const arr = Array.isArray(items) ? items : [];

    const found = arr.find((v: any) => String(v?.id) === String(variationId));
    const url = found?.result?.url || null;

    return res.status(200).json({ ok: true, data: { url, raw: data } });
  } catch (err: any) {
    console.error("[vsai-variation-result] error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Error" });
  }
}
