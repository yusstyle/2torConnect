import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "2torconnect-super-secure-production-jwt-key-2026-xyz";

export interface TokenPayload {
  id: number;
  role: string;
  email: string;
}

/**
 * Signs a payload into a secure HMAC-SHA256 JWT
 */
export function signToken(payload: TokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days validity
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a JWT token and returns payload or null if invalid/tampered
 */
export function verifyToken(token: string | undefined | null): TokenPayload | null {
  if (!token || typeof token !== "string") return null;

  try {
    const cleanToken = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    const parts = cleanToken.split(".");

    if (parts.length === 3) {
      const [header, body, signature] = parts;
      const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSig);
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return null; // Signature verification failed
      }

      const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
      if (parsed.exp && Math.floor(Date.now() / 1000) > parsed.exp) {
        return null; // Expired
      }

      if (!parsed.id || !parsed.role || !parsed.email) {
        return null;
      }

      return {
        id: Number(parsed.id),
        role: String(parsed.role),
        email: String(parsed.email),
      };
    }

    return null;
  } catch {
    return null;
  }
}

