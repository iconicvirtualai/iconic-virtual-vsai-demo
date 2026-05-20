import type { NextApiRequest, NextApiResponse } from "next";

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

    // Check if Firebase is configured
    const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!firebaseServiceAccount || !firebaseStorageBucket) {
      // Firebase not configured - use demo mode with data URL
      console.log("[api/upload] Firebase not configured, using demo mode");
      
      // Return the base64 as a data URL for demo purposes
      const dataUrl = `data:image/jpeg;base64,${fileBase64}`;
      
      return res.status(200).json({
        ok: true,
        data: { 
          publicUrl: dataUrl,
          storagePath: `demo/orders/${userId}/${Date.now()}-${fileName}`,
          isDemo: true 
        },
      });
    }

    // Firebase is configured, try to use it
    try {
      const { firebaseUpload } = await import("../../lib/firebaseAdmin");

      const buffer = Buffer.from(fileBase64, "base64");
      const safeName = String(fileName).replace(/[^a-zA-Z0-9_.-]/g, "_");
      const destPath = `orders/${userId}/${Date.now()}-${safeName}`;

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
      console.warn("[api/upload] Firebase upload failed:", firebaseErr?.message);
      
      // Fallback to demo mode on Firebase error
      console.log("[api/upload] Falling back to demo mode");
      const dataUrl = `data:image/jpeg;base64,${fileBase64}`;
      
      return res.status(200).json({
        ok: true,
        data: { 
          publicUrl: dataUrl,
          storagePath: `demo/orders/${userId}/${Date.now()}-${fileName}`,
          isDemo: true 
        },
      });
    }
  } catch (e: any) {
    console.error("[api/upload] error", e);
    return res.status(500).json({ ok: false, error: e?.message || "Upload failed" });
  }
}
