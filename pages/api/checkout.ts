import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { jobId } = req.body as { jobId: string };

  // TODO: move your checkoutAndFinalize logic here (call VSAI, upload final to Firebase, return downloadUrl)

  return res.status(200).json({
    ok: true,
    data: {
      downloadUrl: "https://example.com/placeholder.jpg",
      job: { id: jobId, status: "paid_done" },
    },
  });
}
