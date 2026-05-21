import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

interface ProStagingSubmission {
  address: string;
  roomType: string;
  style: string;
  service: "staging" | "editing" | "video" | "mixed";
  notes?: string;
  photoCount: number;
  photoLabels?: string[];
  createdAt: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  tokenCost: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { address, roomType, style, service, notes, photoCount } = req.body;

  if (!address || !roomType || !style || !service) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    // Calculate token cost
    const tokenCostMap: Record<string, number> = {
      staging: 2,
      editing: 1,
      video: 3,
      mixed: 5,
    };

    const tokenCost = tokenCostMap[service as string] || 2;

    // Generate submission ID
    const submissionId = `PSS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Demo mode: no Firebase
    if (!db || typeof db.collection !== "function") {
      return res.status(200).json({
        ok: true,
        submissionId,
        data: {
          submissionId,
          address,
          roomType,
          style,
          service,
          photoCount: parseInt(photoCount) || 0,
          tokenCost,
          status: "pending",
          createdAt: new Date().toISOString(),
          isDemo: true,
        },
      });
    }

    // Save to Firestore
    const submissionsCollection = db.collection("pro-staging-submissions");
    
    const submission: ProStagingSubmission = {
      address,
      roomType,
      style,
      service: service as any,
      notes: notes || "",
      photoCount: parseInt(photoCount) || 0,
      createdAt: new Date().toISOString(),
      status: "pending",
      tokenCost,
    };

    await submissionsCollection.doc(submissionId).set(submission);

    return res.status(200).json({
      ok: true,
      submissionId,
      data: {
        submissionId,
        ...submission,
      },
    });
  } catch (error: any) {
    console.error("[/api/pro-staging/submit] error", error);

    // Fallback to demo mode on error
    const submissionId = `PSS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return res.status(200).json({
      ok: true,
      submissionId,
      data: {
        submissionId,
        address,
        roomType,
        style,
        service,
        photoCount: parseInt(req.body.photoCount) || 0,
        status: "pending",
        createdAt: new Date().toISOString(),
        isDemo: true,
      },
    });
  }
}
