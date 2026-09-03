/**
 * Tests for urlUtils.ts — normalizeTopScoreBaseUrl and getTopScoreUrl
 */

import { normalizeTopScoreBaseUrl, getTopScoreUrl } from "../urlUtils";

const ORIGINAL_BASE_URL = process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL;

afterEach(() => {
  process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = ORIGINAL_BASE_URL;
});

describe("normalizeTopScoreBaseUrl", () => {
  it("strips trailing /api from base URL", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com/api";
    jest.resetModules();
    const { normalizeTopScoreBaseUrl: fn } = require("../urlUtils");
    expect(fn()).toBe("https://pada.usetopscore.com");
  });

  it("strips trailing /api/ from base URL", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com/api/";
    jest.resetModules();
    const { normalizeTopScoreBaseUrl: fn } = require("../urlUtils");
    expect(fn()).toBe("https://pada.usetopscore.com");
  });

  it("returns base URL unchanged when no /api suffix", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com";
    jest.resetModules();
    const { normalizeTopScoreBaseUrl: fn } = require("../urlUtils");
    expect(fn()).toBe("https://pada.usetopscore.com");
  });

  it("strips trailing slashes", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com/";
    jest.resetModules();
    const { normalizeTopScoreBaseUrl: fn } = require("../urlUtils");
    expect(fn()).toBe("https://pada.usetopscore.com");
  });
});

describe("getTopScoreUrl", () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = ORIGINAL;
  });

  it("prepends /api when base URL has no /api", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com";
    jest.resetModules();
    const { getTopScoreUrl: fn } = require("../urlUtils");
    expect(fn("/events")).toBe("https://pada.usetopscore.com/api/events");
  });

  it("does not double /api when base URL already has /api", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com/api";
    jest.resetModules();
    const { getTopScoreUrl: fn } = require("../urlUtils");
    expect(fn("/api/events")).toBe("https://pada.usetopscore.com/api/events");
  });

  it("handles paths that already start with /api", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com";
    jest.resetModules();
    const { getTopScoreUrl: fn } = require("../urlUtils");
    expect(fn("/api/events")).toBe("https://pada.usetopscore.com/api/events");
  });

  it("normalizes non-slash-prefixed paths", () => {
    process.env.EXPO_PUBLIC_TOPSCORE_BASE_URL = "https://pada.usetopscore.com";
    jest.resetModules();
    const { getTopScoreUrl: fn } = require("../urlUtils");
    expect(fn("events")).toBe("https://pada.usetopscore.com/api/events");
  });
});