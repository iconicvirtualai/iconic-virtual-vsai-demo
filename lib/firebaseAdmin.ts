// lib/firebaseAdmin.ts
import admin from "firebase-admin";
import crypto from "crypto";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
}
if (!storageBucket) {
  throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");
}

/**
 * Parse service account JSON safely.
 * Common gotcha: private_key newlines get stored as "\\n" in env vars.
 */
function parseServiceAccount(raw: string) {
  const obj = JSON.parse(raw);
  if (obj?.private_key && typeof obj.private_key === "string") {
    obj.private_key = obj.private_key.replace(/\\n/g, "\n");
  }
  return obj as admin.ServiceAccount;
}

if (!admin.apps.length) {
  const serviceAccount = parseServiceAccount(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });
}

export { admin };

// Firestore (useful for client portal, projects, users, orders, etc.)
export const db = admin.firestore();

// Firebase Storage bucket
export const bucket = admin.storage().bucket(storageBucket);

/**
 * Create a stable Firebase download URL using firebaseStorageDownloadTokens.
 * This avoids giant Signed URLs and doesn't expire.
 */
function makeTokenDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    storagePath
  )}?alt=media&token=${token}`;
}

/
