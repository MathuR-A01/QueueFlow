import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-waiting-room-key-2026";
const ITERATIONS = 10000; // legacy
const HARDENED_ITERATIONS = 600000; // OWASP recommended
const KEY_LEN = 64;
const DIGEST = "sha512";

// Hash password with pbkdf2 + salt + iterations
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, HARDENED_ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${HARDENED_ITERATIONS}:${hash}`;
}

// Verify password
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length === 3) {
    const [salt, iterationsStr, originalHash] = parts;
    const iterations = parseInt(iterationsStr, 10);
    const hash = crypto.pbkdf2Sync(password, salt, iterations, KEY_LEN, DIGEST).toString("hex");
    return hash === originalHash;
  } else {
    // Legacy fallback
    const [salt, originalHash] = parts;
    const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
    return hash === originalHash;
  }
}

// Generate lightweight JWT-like token (Header.Payload.Signature)
export function signToken(payload: { userId: string; email: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days expiration
  };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(`${header}.${body}`);
  const signature = hmac.digest("base64url");
  
  return `${header}.${body}.${signature}`;
}

// Verify and decode token
export function verifyToken(token: string): { userId: string; email: string; name: string } | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    
    // Verify signature
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(`${header}.${body}`);
    const expectedSignature = hmac.digest("base64url");
    if (signature !== expectedSignature) return null;
    
    // Decode claims
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    
    // Check expiration
    if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      userId: claims.userId,
      email: claims.email,
      name: claims.name,
    };
  } catch {
    return null;
  }
}

// Helper to get authenticated user from NextRequest
import { NextRequest } from "next/server";

export function getAuthUser(request: NextRequest): { userId: string; email: string; name: string } | null {
  const tokenCookie = request.cookies.get("session_token");
  if (!tokenCookie) return null;
  return verifyToken(tokenCookie.value);
}
