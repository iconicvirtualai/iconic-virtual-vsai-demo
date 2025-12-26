// lib/storeRemoteImage.ts
import { bucket } from "./firebaseAdmin";

export async function storeRemoteImageToFirebase(opts: {
  remoteUrl: string;
  destinationPath: string; // e.g. users/<uid>/projects/<jobId>/variations/2.jpg
  contentType?: string;    // "image/jpeg"
}) {
  const res = await fetch(opts.remoteUrl);
  if (!res.ok) throw new Error(`Failed to fetch remote image: ${res.status}`);

  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const file = bucket.file(opts.destinationPath);

  await file.save(buffer, {
    contentType: opts.contentType || res.headers.get("content-type") || "image/jpeg",
    resumable: false,
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  // make it accessible
  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${encodeURI(opts.destinationPath)}`;
}
