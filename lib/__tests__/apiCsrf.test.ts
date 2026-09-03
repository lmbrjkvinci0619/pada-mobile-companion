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

  it("returns a non-empty string", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig: string) => {
      expect(typeof sig).toBe("string");
      expect(sig.length).toBeGreaterThan(0);
    });
  });

  it("returns a base64url-encoded string (no +, /, or = padding)", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig: string) => {
      expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  it("returns three dot-separated parts (nonce|timestamp|hmac)", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig: string) => {
      const decoded = Buffer.from(sig, "base64").toString("utf8");
      const parts = decoded.split("|");
      expect(parts).toHaveLength(3);
    });
  });

  it("nonce is 16 characters (alphanumeric)", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig: string) => {
      const decoded = Buffer.from(sig, "base64").toString("utf8");
      const [nonce] = decoded.split("|");
      expect(nonce).toMatch(/^[A-Za-z0-9]{16}$/);
    });
  });

  it("timestamp is a Unix epoch in seconds (10-13 digits)", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig: string) => {
      const decoded = Buffer.from(sig, "base64").toString("utf8");
      const [, timestamp] = decoded.split("|");
      expect(parseInt(timestamp, 10)).toBeGreaterThan(1_000_000_000);
    });
  });

  it("throws when CLIENT_ID is missing", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "";
    jest.resetModules();
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return expect(buildApiCsrfSignature()).rejects.toThrow(
      "TopScore credentials not configured"
    );
  });

  it("throws when CLIENT_SECRET is missing", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = "";
    jest.resetModules();
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return expect(buildApiCsrfSignature()).rejects.toThrow(
      "TopScore credentials not configured"
    );
  });

  it("caches the signature and returns the same value within TTL", () => {
    const { buildApiCsrfSignature } = require("../apiCsrf");
    return buildApiCsrfSignature().then((sig1: string) =>
      buildApiCsrfSignature().then((sig2: string) => {
        expect(sig1).toBe(sig2);
      })
    );
  });

  it("produces different signatures for different clients", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "client-A";
    jest.resetModules();
    const { buildApiCsrfSignature: sigA } = require("../apiCsrf");
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = "client-B";
    jest.resetModules();
    const { buildApiCsrfSignature: sigB } = require("../apiCsrf");
    return Promise.all([sigA(), sigB()]).then(([a, b]) => {
      expect(a).not.toBe(b);
    });
  });
});

describe("clearApiCsrfCache", () => {
  it("forces a new signature after cache is cleared", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_ID = CLIENT_ID;
    process.env.EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET = SECRET;
    jest.resetModules();

    const mod = require("../apiCsrf");
    const { buildApiCsrfSignature, clearApiCsrfCache: clearCache } = mod;
    return buildApiCsrfSignature()
      .then((sig1: string) => {
        clearCache();
        return buildApiCsrfSignature().then((sig2: string) => {
          expect(sig1).not.toBe(sig2);
          const decoded1 = Buffer.from(sig1, "base64").toString("utf8");
          const decoded2 = Buffer.from(sig2, "base64").toString("utf8");
          const [, ts1] = decoded1.split("|");
          const [, ts2] = decoded2.split("|");
          expect(parseInt(ts2, 10)).toBeGreaterThanOrEqual(parseInt(ts1, 10));
        });
      });
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

  it("returns a fully-qualified HTTPS URL", () => {
    const url = buildSignedUrl("/api/events", "token123", "sig456");
    expect(url).toMatch(/^https:\/\//);
  });

  it("appends auth_token and api_csrf query params", () => {
    const url = buildSignedUrl("/api/events", "token123", "sig456");
    expect(url).toContain("auth_token=token123");
    expect(url).toContain("api_csrf=sig456");
  });

  it("preserves existing query params", () => {
    const url = buildSignedUrl("/api/events?foo=bar", "tok", "sig");
    expect(url).toContain("foo=bar");
    expect(url).toContain("auth_token=tok");
  });

  it("handles paths without leading slash", () => {
    const url = buildSignedUrl("api/events", "tok", "sig");
    expect(url).toContain("/api/events");
  });

  it("handles fragment (hash) in path", () => {
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
    expect(url).not.toMatch(/pada\.usetopscore\.com\/{2,}/);
  });
});