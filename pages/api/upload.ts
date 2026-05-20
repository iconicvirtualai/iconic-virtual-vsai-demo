import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseUpload } from "../../lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { userId, fileName, fileBase64 } = req.body || {};

    if (!userId || !fileName || !fileBase64) {
      return res.status(400).json({
        ok: false,
        error: "Missing userId, fileName or fileBase64",
      });
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const safeName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, "_");
    const destPath = `orders/${userId}/${Date.now()}-${safeName}`;

    try {
      const { publicUrl, storagePath } = await firebaseUpload(
        buffer,
        destPath,
        "image/jpeg"
      );

      return res.status(200).json({
        ok: true,
        data: { publicUrl, storagePath },
      });
    } catch (firebaseErr: any) {
      console.warn("[api/upload] Firebase not configured:", firebaseErr?.message);
      // Return error to user - they need Firebase configured for uploads
      return res.status(500).json({
        ok: false,
        error: "Upload service not configured. Please contact support.",
      });
    }
  } catch (e: any) {
    console.error("[api/upload] error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Upload failed" });
  }
}
