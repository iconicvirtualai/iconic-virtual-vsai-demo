import admin from "firebase-admin";

// keep this untyped to avoid Bucket type mismatch
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

export async function firebaseUpload(
  buffer: Buffer,
  destPath: string,
  contentType = "image/jpeg"
) {
  const file = bucket.file(destPath);

  await file.save(buffer, {
    contentType,
    public: true, // change this later if you want signed URLs
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
  return { publicUrl, storagePath: destPath };
}
