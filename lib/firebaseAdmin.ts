// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
}

const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount & {
  project_id?: string;
};

const normalizeBucketName = (value?: string | null) =>
  (value || "")
    .trim()
    .replace(/^gs:\/\//i, "")
    .replace(/^https?:\/\/storage.googleapis.com\//i, "")
    .replace(/\/+$/, "");

const resolveBucketName = () => {
  const fromEnv = normalizeBucketName(process.env.FIREBASE_STORAGE_BUCKET);
  if (fromEnv) return fromEnv;

  const projectId =
    serviceAccount.project_id ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.PROJECT_ID;

  return projectId ? normalizeBucketName(`${projectId}.appspot.com`) : "";
};

// Prefer explicit env, then any known project id, otherwise fail fast with guidance
const storageBucket = resolveBucketName();

if (!storageBucket) {
  throw new Error(
    "FIREBASE_STORAGE_BUCKET is missing. Provide a bucket name (no gs://) or set FIREBASE_SERVICE_ACCOUNT.project_id."
  );
}

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
