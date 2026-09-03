import { TOPSCORE_CLIENT_ID, TOPSCORE_CLIENT_SECRET } from "@/constants/config";
import { normalizeTopScoreBaseUrl } from "./urlUtils";

function base64UrlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = (typeof btoa !== "undefined" && (typeof process === "undefined" || process.env.NODE_ENV !== "test"))
    ? btoa(binary)
    : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return base64UrlEncode(new Uint8Array(sig));
  }
  return "";
}

function getSecureRandomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
    return buf;
  }
  const fallback = new Uint8Array(length);
  const now = Date.now();
  const random = Math.random();
  for (let i = 0; i < length; i++) {
    const t = now + i * 1000;
    const r = random * 1e9;
    fallback[i] = ((t ^ r) >>> 0) % 256;
  }
  return fallback;
}

function randomNonce(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = getSecureRandomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

let cachedCsrf: { signature: string; expiresAt: number } | null = null;
// Per TopScore API spec Section 3.1: CSRF signatures are valid for 1 hour (3600 seconds)
// We use 55 minutes to provide a 5-minute refresh buffer before actual expiry
const CSRF_TTL_MS = 55 * 60 * 1000;
const CSRF_REFRESH_BUFFER_MS = 5 * 60 * 1000;

export async function buildApiCsrfSignature(): Promise<string> {
  if (cachedCsrf && Date.now() < cachedCsrf.expiresAt - CSRF_REFRESH_BUFFER_MS) {
    return cachedCsrf.signature;
  }

  const clientId = TOPSCORE_CLIENT_ID;
  const clientSecret = TOPSCORE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("TopScore credentials not configured; cannot sign API request");
  }

  const nonce = randomNonce(16);
  const timestamp = Math.floor(Date.now() / 1000);
  const concatenated = `${clientId}${nonce}${timestamp}`;
  const hmac = await hmacSha256(clientSecret, concatenated);
  if (!hmac) {
    throw new Error("HMAC computation failed in this environment");
  }
  const signature = base64UrlEncode(`${nonce}|${timestamp}|${hmac}`);

  cachedCsrf = {
    signature,
    expiresAt: Date.now() + CSRF_TTL_MS,
  };
  return signature;
}

export function clearApiCsrfCache(): void {
  cachedCsrf = null;
}

export function buildSignedUrl(path: string, authToken: string, csrfSignature: string): string {
  const [pathWithoutHash, hash] = path.split("#");
  const [purePath, existingQuery = ""] = pathWithoutHash.split("?");

  const base = `${normalizeTopScoreBaseUrl()}${purePath.startsWith("/") ? purePath : `/${purePath}`}`;
  const params = new URLSearchParams(existingQuery);
  params.set("auth_token", authToken);
  params.set("api_csrf", csrfSignature);
  const qs = params.toString();
  return `${base}?${qs}${hash ? `#${hash}` : ""}`;
}
