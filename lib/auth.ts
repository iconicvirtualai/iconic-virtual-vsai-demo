// lib/auth.ts — Authentication utilities (password hashing + JWT)
import { SignJWT, jwtVerify } from "jose";
import { randomBytes, pbkdf2Sync } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(32).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const attempt = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return attempt === hash;
}

function getSecret() {
  const raw = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!raw) throw new Error("JWT_SECRET env var is missing");
  return new TextEncoder().encode(raw);
}

export async function createToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}
