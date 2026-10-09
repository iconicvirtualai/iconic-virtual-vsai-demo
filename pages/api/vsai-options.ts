import type { NextApiRequest, NextApiResponse } from "next";
import { readVsaiApiKey, VSAI_ROOM_TYPES, VSAI_STYLES } from "../../lib/vsaiOptions";

const DOCUMENTED = {
  styles: [...VSAI_STYLES],
  roomTypes: [...VSAI_ROOM_TYPES],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const VSAI_API_KEY = readVsaiApiKey();
  const VSAI_API_BASE = (process.env.VSAI_API_BASE || "https://api.virtualstagingai.app/v1").replace(
    /\/$/,
    ""
  );

  if (!VSAI_API_KEY) {
    return res.status(500).json({
      error: "VSAI_API_KEY not configured",
      ...DOCUMENTED,
      source: "documented-fallback",
    });
  }

  try {
    const resp = await fetch(`${VSAI_API_BASE}/options`, {
      method: "GET",
      headers: {
        Authorization: `Api-Key ${VSAI_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("VSAI options error:", resp.status, text.slice(0, 300));
      const rejected = resp.status === 401 || resp.status === 403;
      return res.status(502).json({
        error: rejected
          ? "VSAI_API_KEY was rejected by Virtual Staging AI"
          : "VSAI options error",
        upstreamStatus: resp.status,
        ...DOCUMENTED,
        source: "documented-fallback",
      });
    }

    const data = await resp.json();
    const styles = Array.isArray(data?.styles) && data.styles.length ? data.styles : DOCUMENTED.styles;
    const roomTypes =
      (Array.isArray(data?.roomTypes) && data.roomTypes.length && data.roomTypes) ||
      (Array.isArray(data?.room_types) && data.room_types.length && data.room_types) ||
      DOCUMENTED.roomTypes;

    return res.status(200).json({ ...data, styles, roomTypes, source: "upstream" });
  } catch (err) {
    console.error("vsai-options error:", err);
    return res.status(502).json({
      error: "VSAI options error",
      ...DOCUMENTED,
      source: "documented-fallback",
    });
  }
}
