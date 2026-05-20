// lib/firebaseAdmin.ts
import * as admin from "firebase-admin";

let app: admin.app.App | null = null;
let initialized = false;
let initError: Error | null = null;

function initializeApp() {
  if (initialized) return;
  initialized = true;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
    }
    if (!storageBucket) {
      throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    app =
      admin.apps.length > 0
        ? admin.app()
        : admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            storageBucket,
          });
  } catch (e) {
    initError = e instanceof Error ? e : new Error(String(e));
  }
}

export function getFirebaseApp(): admin.app.App {
  if (!initialized) initializeApp();
  if (initError) throw initError;
  if (!app) throw new Error("Firebase app failed to initialize");
  return app;
}

export const db = {
  collection: (path: string) => {
    const firebaseApp = getFirebaseApp();
    return admin.firestore(firebaseApp).collection(path);
  },
  runTransaction: (fn: (transaction: admin.firestore.Transaction) => Promise<any>) => {
    const firebaseApp = getFirebaseApp();
    return admin.firestore(firebaseApp).runTransaction(fn);
  },
} as any;

export const bucket = {
  file: (path: string) => {
    const firebaseApp = getFirebaseApp();
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");
    return admin.storage(firebaseApp).bucket(storageBucket).file(path);
  },
} as any;

/**
 * Uploads a buffer to Firebase Storage and returns a long-lived signed URL.
 */
export async function firebaseUpload(
  buffer: Buffer,
  destPath: string,
  contentType = "image/jpeg"
) {
  const firebaseApp = getFirebaseApp();
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!storageBucket) throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");

  const file = admin.storage(firebaseApp).bucket(storageBucket).file(destPath);

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
