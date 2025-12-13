// pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getJob, saveJob } from "../../lib/jobs";
import { fetchVsai, pickFirstOutputUrl } from "../../lib/vsai";
import { firebaseUpload } from "../../lib/firebaseAdmin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const { jobId } = req.body || {};
  if (!jobId || typeof jobId !== "string") {
    return res
      .status(400)
      .json({ ok: false, error: "jobId is required" });
  }

  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({ ok: false, error: "Job not found" });
  }

  try {
    const hasRealKey =
      !!process.env.VSAI_API_KEY ||
      !!process.env.VIRTUAL_STAGING_AI_API_KEY;

    job.status = "paid_rendering";
    saveJob(job);

    let finalUrl = "";

    if (hasRealKey) {
      const payload = {
        image_url: job.source.publicUrl,
        room_type: job.room_type,
        style: job.style,
        wait_for_completion: true,
        add_virtually_staged_watermark: "false",
      };

      const json: any = await fetchVsai("/render/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const outputs: any[] =
        json.outputs || (json.result_image_url ? [json.result_image_url] : []);
      finalUrl = pickFirstOutputUrl(outputs) || "";
    } else {
      // Demo mode
      finalUrl =
        "https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=800";
    }

    if (!finalUrl) {
      throw new Error("No output returned by Virtual Staging AI");
    }

    // Download final image
    const imgResp = await fetch(finalUrl);
    if (!imgResp.ok) {
      throw new Error(`Failed to download final image: ${imgResp.status}`);
    }

    const arrayBuf = await imgResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const destPath = `orders/${job.userId}/completed/final-${Date.now()}.jpg`;

    const { publicUrl } = await firebaseUpload(
      buffer,
      destPath,
      imgResp.headers.get("content-type") || "image/jpeg"
    );

    job.final = { url: publicUrl, storagePath: destPath };
    job.status = "paid_done";
    saveJob(job);

    return res.status(200).json({
      ok: true,
      data: {
        downloadUrl: publicUrl,
        job,
      },
    });
  } catch (e: any) {
    console.error("[checkout] Error:", e.message || e);
    job.status = "error";
    job.error = e.message || "Checkout failed";
    saveJob(job);
    return res.status(500).json({ ok: false, error: job.error });
  }
}
