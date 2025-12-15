import admin from "firebase-admin";

let bucket: any;

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
  }
  if (!storageBucket) {
    throw new Error("FIREBASE_STORAGE_BUCKET env var is missing");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket,
  });

  bucket = admin.storage().bucket();
} else {
  bucket = admin.storage().bucket();
}

/**
 * Uploads a buffer to Firebase Storage and returns a long-lived signed URL
 * that can be accessed publicly (no auth).
 */
export async function firebaseUpload(
  buffer: Buffer,
  destPath: string,
  contentType = "image/jpeg"
) {
  const file = bucket.file(destPath);

  // NO `public: true` here – avoids legacy ACLs with uniform bucket-level access
  await file.save(buffer, {
    contentType,
  });

  // Create a READ signed URL that VSAI and clients can access
  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    // far-future expiry so it’s effectively “permanent”
    expires: "2500-01-01",
  });

  return {
    publicUrl: signedUrl,
    storagePath: destPath,
  };
}
