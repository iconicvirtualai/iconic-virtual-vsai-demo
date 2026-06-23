import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseUpload } from "../../lib/firebaseAdmin";

export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { sourceUrl, key } = req.body || {};
      if (!sourceUrl || !key) return res.status(400).json({ error: "Missing sourceUrl or key" });

        try {
            const imgResp = await fetch(sourceUrl);
                if (!imgResp.ok) return res.status(502).json({ error: "Fetch failed: " + imgResp.status });

                    const arrayBuf = await imgResp.arrayBuffer();
                        const buffer = Buffer.from(arrayBuf);
                            const ext = sourceUrl.includes(".png") ? ".png" : ".jpg";
                                const contentType = ext === ".png" ? "image/png" : "image/jpeg";
                                    const destPath = "gallery/" + key + ext;

                                        const { publicUrl, storagePath } = await firebaseUpload(buffer, destPath, contentType);
                                            return res.status(200).json({ ok: true, key, publicUrl, storagePath });
                                              } catch (e: any) {
                                                  return res.status(500).json({ error: e?.message || "Upload failed" });
                                                    }
                                                    }
