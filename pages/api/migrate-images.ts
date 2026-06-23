import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseUpload, bucket } from "../../lib/firebaseAdmin";

export const config = { api: { bodyParser: { sizeLimit: "20mb" } } };

async function getGalleryUrls() {
  const [files] = await bucket.getFiles({ prefix: "gallery/" });
  const results = await Promise.all(
    files.map(async (file) => {
      const key = file.name.replace("gallery/", "").replace(/\.[^.]+$/, "");
      const [signedUrl] = await file.getSignedUrl({ action: "read", expires: "2500-01-01" });
      return { key, signedUrl };
    })
  );
  const urls: Record<string, string> = {};
  results.forEach((r) => (urls[r.key] = r.signedUrl));
  return urls;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    try {
      const urls = await getGalleryUrls();
      const buildFile = req.query.build as string | undefined;

      if (!buildFile) return res.status(200).json({ ok: true, urls });

      const rawBase = "https://raw.githubusercontent.com/iconicvirtualai/iconic-virtual-vsai-demo/main";

      if (buildFile === "gallery") {
        const orig = await fetch(rawBase + "/pages/gallery.tsx").then((r) => r.text());
        const galleryCards = [
          { key: "standard_kitchen", style: "Modern Minimalist", room: "Kitchen", loc: "Seattle, WA" },
          { key: "scandinavian_master", style: "Scandinavian", room: "Master Bedroom", loc: "Portland, OR" },
          { key: "coastal_living", style: "Coastal Contemporary", room: "Living Room", loc: "San Diego, CA" },
          { key: "industrial_master", style: "Industrial Modern", room: "Master Bedroom", loc: "Brooklyn, NY" },
          { key: "coastal_dining", style: "Coastal Elegance", room: "Dining Room", loc: "Charleston, SC" },
          { key: "standard_living", style: "Contemporary Classic", room: "Living Room", loc: "Denver, CO" },
        ];
        let aiStr = "const aiExamples = [\n";
        galleryCards.forEach((c) => {
          aiStr += `  {\n    before: "${urls[c.key + "_before"]}",\n    after: "${urls[c.key + "_after"]}",\n    style: "${c.style}",\n    room: "${c.room}",\n    location: "${c.loc}",\n  },\n`;
        });
        aiStr += "];";
        let result = orig.replace(/const aiExamples = \[[\s\S]*?\];/, aiStr);

        const proCards = [
          { key: "coastal_kitchen", style: "Coastal Kitchen", room: "Kitchen", loc: "Miami, FL" },
          { key: "luxury_living", style: "Luxury Contemporary", room: "Living Room", loc: "Los Angeles, CA" },
          { key: "farmhouse_living", style: "Farmhouse Modern", room: "Living Room", loc: "Dallas, TX" },
          { key: "coastal_master", style: "Coastal Retreat", room: "Master Bedroom", loc: "Naples, FL" },
        ];
        let proStr = "const proExamples = [\n";
        proCards.forEach((c) => {
          proStr += `  {\n    before: "${urls[c.key + "_before"]}",\n    after: "${urls[c.key + "_after"]}",\n    style: "${c.style}",\n    room: "${c.room}",\n    location: "${c.loc}",\n  },\n`;
        });
        proStr += "];";
        result = result.replace(/const proExamples = \[[\s\S]*?\];/, proStr);

        res.setHeader("Content-Type", "text/plain");
        return res.status(200).send(result);
      }

      if (buildFile === "home") {
        const orig = await fetch(rawBase + "/public/home.html").then((r) => r.text());
        const homeCards = [
          { key: "coastal_kitchen", tag: "Coastal", title: "Coastal Kitchen", desc: "Kitchen &bull; Miami, FL" },
          { key: "scandinavian_living", tag: "Scandi", title: "Scandinavian Living", desc: "Living Room &bull; Austin, TX" },
          { key: "luxury_living", tag: "Luxury", title: "Luxury Contemporary", desc: "Living Room &bull; Los Angeles, CA" },
          { key: "industrial_kitchen", tag: "Industrial", title: "Industrial Kitchen", desc: "Kitchen &bull; Chicago, IL" },
          { key: "farmhouse_living", tag: "Farm", title: "Farmhouse Modern", desc: "Living Room &bull; Dallas, TX" },
          { key: "coastal_master", tag: "Coastal", title: "Coastal Retreat", desc: "Master Bedroom &bull; Naples, FL" },
        ];
        let newCards = "";
        homeCards.forEach((c) => {
          const b = urls[c.key + "_before"];
          const a = urls[c.key + "_after"];
          newCards += `      <div class="gallery-card">\n        <div class="gallery-visual">\n          <div class="before" style="background:url('${b}') center/cover no-repeat">\n            <span style="background:rgba(0,0,0,0.55);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px">BEFORE</span>\n          </div>\n          <div class="arrow">&rarr;</div>\n          <div class="after" style="background:url('${a}') center/cover no-repeat">\n            <span style="background:rgba(255,255,255,0.85);color:#0a0a0a;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:1px">AFTER</span>\n          </div>\n        </div>\n        <div class="gallery-info"><span class="style-tag">${c.tag}</span><h4>${c.title}</h4><p>${c.desc}</p></div>\n      </div>\n`;
        });
        const match = orig.match(/<div class="gallery-grid">([\s\S]*?)<\/div>\s*<div class="gallery-cta">/);
        if (match) {
          const oldSection = '<div class="gallery-grid">' + match[1] + '</div>\n    <div class="gallery-cta">';
          const newSection = '<div class="gallery-grid">\n' + newCards + '    </div>\n    <div class="gallery-cta">';
          const result = orig.replace(oldSection, newSection);
          res.setHeader("Content-Type", "text/html");
          return res.status(200).send(result);
        }
        return res.status(500).json({ error: "Could not find gallery section in home.html" });
      }

      return res.status(400).json({ error: "Unknown build target: " + buildFile });
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
    const destPath = "gallery/" + key + ext;
    const { publicUrl, storagePath } = await firebaseUpload(buffer, destPath, contentType);
    return res.status(200).json({ ok: true, key, publicUrl, storagePath });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Upload failed" });
  }
           }
