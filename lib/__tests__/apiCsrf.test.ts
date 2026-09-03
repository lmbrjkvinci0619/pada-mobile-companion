/**
 * Tests for apiCsrf.ts — buildApiCsrfSignature, clearApiCsrfCache, buildSignedUrl
 */

import { clearApiCsrfCache, buildSignedUrl } from "../apiCsrf";

const SECRET = "test-secret-32chars-long-enough!!";
const CLIENT_ID = "test-client-id";

describe("buildApiCsrfSignature", () => {
  const ORIGINAL_CLIENT_ID = process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID;
  const ORIGINAL_CLIENT_SECRET = process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET;

  beforeEach(() => {
    clearApiCsrfCache();
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = CLIENT_ID;
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = SECRET;
    jest.resetModules();
  });

  afterEach(() => {
    clearApiCsrfCache();
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = ORIGINAL_CLIENT_ID;
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = ORIGINAL_CLIENT_SECRET;
    jest.resetModules();
  });

  it("returns a non-empty string", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig = await buildApiCsrfSignature();
    expect(typeof sig).toBe("string");
    expect(sig.length).toBeGreaterThan(0);
  });

  it("returns a base64url-encoded string (no +, /, or = padding)", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig = await buildApiCsrfSignature();
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns three dot-separated parts (nonce|timestamp|hmac)", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig = await buildApiCsrfSignature();
    const parts = sig.split("|");
    expect(parts).toHaveLength(3);
  });

  it("nonce is 16 characters (alphanumeric)", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig = await buildApiCsrfSignature();
    const [nonce] = sig.split("|");
    expect(nonce).toMatch(/^[A-Za-z0-9]{16}$/);
  });

  it("timestamp is a Unix epoch in seconds (10-13 digits)", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig = await buildApiCsrfSignature();
    const [, timestamp] = sig.split("|");
    expect(parseInt(timestamp, 10)).toBeGreaterThan(1_000_000_000);
  });

  it("throws when CLIENT_ID is missing", async () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "";
    jest.resetModules();
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    await expect(buildApiCsrfSignature()).rejects.toThrow(
      "TopScore credentials not configured"
    );
  });

  it("throws when CLIENT_SECRET is missing", async () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = "";
    jest.resetModules();
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    await expect(buildApiCsrfSignature()).rejects.toThrow(
      "TopScore credentials not configured"
    );
  });

  it("caches the signature and returns the same value within TTL", async () => {
    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig1 = await buildApiCsrfSignature();
    const sig2 = await buildApiCsrfSignature();
    expect(sig1).toBe(sig2);
  });

  it("produces different signatures for different clients", async () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "client-A";
    jest.resetModules();
    const { buildApiCsrfSignature: sigA } = await import("../apiCsrf");
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "client-B";
    jest.resetModules();
    const { buildApiCsrfSignature: sigB } = await import("../apiCsrf");
    const a = await sigA();
    const b = await sigB();
    expect(a).not.toBe(b);
  });
});

describe("clearApiCsrfCache", () => {
  it("forces a new signature after cache is cleared", async () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = CLIENT_ID;
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = SECRET;
    jest.resetModules();

    const { buildApiCsrfSignature } = await import("../apiCsrf");
    const sig1 = await buildApiCsrfSignature();
    clearApiCsrfCache();
    const sig2 = await buildApiCsrfSignature();

    expect(sig1).not.toBe(sig2);
    const [, ts1] = sig1.split("|");
    const [, ts2] = sig2.split("|");
    expect(parseInt(ts2, 10)).toBeGreaterThanOrEqual(parseInt(ts1, 10));
  });
});

describe("buildSignedUrl", () => {
  const BASE_URL = "https://pada.usetopscore.com";

  beforeEach(() => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = BASE_URL;
    jest.resetModules();
    clearApiCsrfCache();
  });

  afterEach(() => {
    clearApiCsrfCache();
  });

  it("returns a fully-qualified HTTPS URL", async () => {
    const url = buildSignedUrl("/api/events", "token123", "sig456");
    expect(url).toMatch(/^https:\/\//);
  });

  it("appends auth_token and api_csrf query params", async () => {
    const url = buildSignedUrl("/api/events", "token123", "sig456");
    expect(url).toContain("auth_token=token123");
    expect(url).toContain("api_csrf=sig456");
  });

  it("preserves existing query params", async () => {
    const url = buildSignedUrl("/api/events?foo=bar", "tok", "sig");
    expect(url).toContain("foo=bar");
    expect(url).toContain("auth_token=tok");
  });

  it("handles paths without leading slash", async () => {
    const url = buildSignedUrl("api/events", "tok", "sig");
    expect(url).toContain("/api/events");
  });

  it("handles fragment (hash) in path", async () => {
    const url = buildSignedUrl("/api/events#section", "tok", "sig");
    expect(url).toContain("/api/events");
    expect(url).toContain("#section");
    expect(url.split("#")[0]).not.toContain("#");
  });

  it("uses normalized base URL (no trailing slash)", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com/";
    jest.resetModules();
    const { buildSignedUrl: fn } = require("../apiCsrf");
    const url = fn("/api/events", "tok", "sig");
    expect(url).toMatch(/^https:\/\/pada\.usetopscore\.com\/api\/events/);
    expect(url).not.toMatch(/pada\.usetopscore\.com\/+/);
  });
});