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

/**
 * Uploads a buffer to Firebase Storage and returns a stable download URL.
 * This is public via token (no auth) and does NOT expire.
 */
export async function firebaseUpload(
  buffer: Buffer,
  destPath: string,
  contentType = "image/jpeg"
) {
  const file = bucket.file(destPath);

  // token makes a stable download URL
  const token = crypto.randomUUID();

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  return {
    publicUrl: makeTokenDownloadUrl(bucket.name, destPath, token),
    storagePath: destPath,
  };
}

/**
 * Optional: if you ever need a Signed URL instead.
 * (Typically longer + includes query signature, but sometimes useful.)
 */
export async function firebaseUploadSignedUrl(
  buffer: Buffer,
  destPath: string,
  contentType = "image/jpeg"
) {
  const file = bucket.file(destPath);

  await file.save(buffer, {
    contentType,
    resumable: false,
  });

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: "2500-01-01",
  });

  return {
    publicUrl: signedUrl,
    storagePath: destPath,
  };
}
