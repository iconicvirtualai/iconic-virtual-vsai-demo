// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
}
if (!storageBucket) {
  throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");
}

const serviceAccount = JSON.parse(serviceAccountJson);

const app =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket,
      });

export const db = admin.firestore(app);

// IMPORTANT: use the configured bucket name explicitly
export const bucket = admin.storage(app).bucket(storageBucket);

/**
 * Uploads a buffer to Firebase Storage and returns a long-lived signed URL.
 */
export async function firebaseUpload(
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
