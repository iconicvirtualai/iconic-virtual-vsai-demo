// pages/api/dashboard/projects.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../../lib/firebaseAdmin";
import { verifyToken } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "Unauthorized" });
  const decoded = await verifyToken(authHeader.slice(7));
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });
  const userId = decoded.userId;

  if (req.method === "GET") {
    try {
      const snap = await db.collection("projects").where("userId", "==", userId).get();
      const projects: any[] = [];
      snap.forEach((doc: any) => projects.push({ id: doc.id, ...doc.data() }));
      projects.sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      return res.status(200).json({ ok: true, projects });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "POST") {
    const { name, description, address } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: "Project name required" });
    const now = new Date().toISOString();
    const data = { userId, name: name.trim(), description: (description || "").trim(), address: (address || "").trim(), status: "active", totalStagings: 0, creditsUsed: 0, createdAt: now, updatedAt: now };
    try {
      const ref = await db.collection("projects").add(data);
      return res.status(201).json({ ok: true, project: { id: ref.id, ...data } });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  if (req.method === "DELETE") {
    const { projectId } = req.body || {};
    if (!projectId) return res.status(400).json({ ok: false, error: "projectId required" });
    try {
      const ref = db.collection("projects").doc(projectId);
      const snap = await ref.get();
      if (!snap.exists) return res.status(404).json({ ok: false, error: "Not found" });
      if (snap.data()?.userId !== userId) return res.status(403).json({ ok: false, error: "Not your project" });
      await ref.delete();
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
