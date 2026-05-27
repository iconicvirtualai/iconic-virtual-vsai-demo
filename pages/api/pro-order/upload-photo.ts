import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseUpload } from "../../../lib/firebaseAdmin";
import crypto from "crypto";

export const config = {
  api: { bodyParser: { sizeLimit: "6mb" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { imageBase64, fileName, contentType } = req.body || {};

    if (!imageBase64) return res.status(400).json({ ok: false, error: "Image data is required" });

    // Strip data URL prefix if present (e.g. "data:image/jpeg;base64,...")
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const buffer = Buffer.from(base64Data, "base64");

    // Validate size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ ok: false, error: "Image must be under 5MB" });
    }

    // Generate unique path
    const ext = (fileName || "photo.jpg").split(".").pop() || "jpg";
    const id = crypto.randomBytes(8).toString("hex");
    const destPath = `pro-orders/uploads/${Date.now()}-${id}.${ext}`;

    const mime = contentType || "image/jpeg";
    const { publicUrl, storagePath } = await firebaseUpload(buffer, destPath, mime);

    return res.status(200).json({ ok: true, url: publicUrl, storagePath });
  } catch (err: any) {
    console.error("Photo upload error:", err);
    return res.status(500).json({ ok: false, error: "Failed to upload photo" });
  }
}
