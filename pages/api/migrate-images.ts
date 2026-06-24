import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseUpload, bucket } from "../../lib/firebaseAdmin";

export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

// Firebase Storage folder paths
const HERO_PREFIX = "gallery/Home Page/Hero Section Slider/";
const TILES_PREFIX = "gallery/Home Page/AI Transformation Before & After Tiles/";
const GALLERY_PREFIX = "gallery/Home Page/Gallery/";

async function getSignedUrl(file: any): Promise<string> {
  const [url] = await file.getSignedUrl({ action: "read", expires: "2500-01-01" });
  return url;
}

async function getAllUrls() {
  const urls: Record<string, string> = {};

  // Hero Section Slider: hero_slide1_before.jpg => "hero:slide1_before"
  const [heroFiles] = await bucket.getFiles({ prefix: HERO_PREFIX });
  await Promise.all(
    heroFiles.map(async (file) => {
      const name = file.name.replace(HERO_PREFIX, "").replace(/\.[^.]+$/, "");
      const key = "hero:" + name.replace(/^hero_/, "");
      urls[key] = await getSignedUrl(file);
    })
  );

  // AI Transformation Tiles: homepage_tile1_before.jpeg => "tile:1_before"
  const [tileFiles] = await bucket.getFiles({ prefix: TILES_PREFIX });
  await Promise.all(
    tileFiles.map(async (file) => {
      const name = file.name.replace(TILES_PREFIX, "").replace(/\.[^.]+$/, "");
      const key = "tile:" + name.replace(/^homepage_tile/, "");
      urls[key] = await getSignedUrl(file);
    })
  );

  // Gallery: gallery_before1.jpg => "gallery:1_before", gallery_after1.jpg => "gallery:1_after"
  const [galleryFiles] = await bucket.getFiles({ prefix: GALLERY_PREFIX });
  await Promise.all(
    galleryFiles.map(async (file) => {
      const name = file.name.replace(GALLERY_PREFIX, "").replace(/\.[^.]+$/, "").toLowerCase();
      const mBefore = name.match(/^gallery_before(\d+)$/i);
      const mAfter = name.match(/^gallery_after(\d+)$/i);
      let key = "";
      if (mBefore) key = "gallery:" + mBefore[1] + "_before";
      else if (mAfter) key = "gallery:" + mAfter[1] + "_after";
      if (key) urls[key] = await getSignedUrl(file);
    })
  );

  return urls;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const urls = await getAllUrls();
      return res.status(200).json({ ok: true, urls });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Failed" });
    }
  }

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
    const destPath = "gallery/Home Page/uploads/" + key + ext;
    const { publicUrl, storagePath } = await firebaseUpload(buffer, destPath, contentType);
    return res.status(200).json({ ok: true, key, publicUrl, storagePath });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Upload failed" });
  }
}
