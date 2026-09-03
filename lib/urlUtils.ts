import { Linking } from "react-native";
import { TOPSCORE_BASE_URL, PADA_ORG_URL } from "@/constants/config";

/**
 * Normalize the TopScore base URL to a canonical host root (no trailing /api).
 * Per TopScore API doc Section 2, the configured base URL may or may not
 * include the `/api` suffix. This helper always returns the host root so
 * callers can safely append path components.
 */
export function normalizeTopScoreBaseUrl(): string {
  if (TOPSCORE_BASE_URL.endsWith("/api")) return TOPSCORE_BASE_URL.slice(0, -4);
  if (TOPSCORE_BASE_URL.endsWith("/api/")) return TOPSCORE_BASE_URL.slice(0, -5);
  return TOPSCORE_BASE_URL.replace(/\/$/, "");
}

/**
 * Constructs a TopScore URL from a path.
 *
 * Per doc Section 2 the base URL has two acceptable configurations:
 *   1. https://pada.usetopscore.com       (paths prepend `/api`)
 *   2. https://pada.usetopscore.com/api   (paths do NOT prepend `/api`)
 *
 * This helper handles both by inspecting the configured base URL.
 */
export function getTopScoreUrl(path: string): string {
  const base = normalizeTopScoreBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseIncludesApi = TOPSCORE_BASE_URL.includes("/api");

  if (baseIncludesApi) {
    if (normalizedPath.startsWith("/api")) return `${base}${normalizedPath}`;
    return `${base}/api${normalizedPath}`;
  }
  if (!normalizedPath.startsWith("/api")) return `${base}/api${normalizedPath}`;
  return `${base}${normalizedPath}`;
}

export function getEventUrl(eventSlug: string): string {
  return `${PADA_ORG_URL}/e/${eventSlug}`;
}

export function getTeamUrl(teamSlug: string): string {
  return `${PADA_ORG_URL}/t/${teamSlug}`;
}

export function getEventsPageUrl(): string {
  return `${PADA_ORG_URL}/e`;
}

export function getTeamsPageUrl(): string {
  return `${PADA_ORG_URL}/t`;
}

export function getRegistrationUrl(registrationId: string, eventId?: string, teamId?: string, leagueId?: string): string {
  if (eventId) {
    return `${PADA_ORG_URL}/e/${eventId}`;
  }
  if (teamId) {
    return `${PADA_ORG_URL}/t/${teamId}`;
  }
  if (leagueId) {
    return `${PADA_ORG_URL}/l/${leagueId}`;
  }
  return getEventsPageUrl();
}

export function openRegistrationInBrowser(
  registrationId: string,
  eventId?: string,
  teamId?: string,
  leagueId?: string
): void {
  const url = getRegistrationUrl(registrationId, eventId, teamId, leagueId);
  Linking.openURL(url).catch((err) => {
    console.error("Failed to open URL:", err);
  });
}

export function openEventInBrowser(eventSlug: string): void {
  const url = getEventUrl(eventSlug);
  Linking.openURL(url).catch((err) => {
    console.error("Failed to open URL:", err);
  });
}

export function openTeamInBrowser(teamSlug: string): void {
  const url = getTeamUrl(teamSlug);
  Linking.openURL(url).catch((err) => {
    console.error("Failed to open URL:", err);
  });
}

export function openUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (!["https", "http", "mailto", "tel"].includes(parsed.protocol.replace(/:$/, ""))) {
      console.warn("Blocked potentially unsafe URL scheme:", parsed.protocol);
      return;
    }
    Linking.openURL(url).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  } catch {
    console.warn("Invalid URL:", url);
  }
}

/**
 * Try to open a custom-scheme deep link (e.g. `venmo://`) in its native app.
 * Falls back to a web URL if the app isn't installed or the scheme fails.
 */
export function openWithAppFallback(appUrl: string, webUrl: string): void {
  Linking.openURL(appUrl).catch(() => openUrl(webUrl));
}

export function openPadaOrg(path: string): void {
  Linking.openURL(`${PADA_ORG_URL}${path}`).catch((err) => {
    console.error("Failed to open URL:", err);
  });
}

export function openExternalPage(path: string): void {
  if (path.startsWith("http")) {
    openUrl(path);
  } else if (/^[a-z0-9-]+$/i.test(path)) {
    openPadaOrg(path);
  } else {
    console.warn("Blocked potentially unsafe path:", path);
  }
}

export const EXTERNAL_URLS = {
  donate: `${PADA_ORG_URL}/donate`,
  devDonatePaypal: "https://paypal.me/michaelsvinci",
  devDonateVenmo: "venmo://paycharge?txn=pay&recipients=Michael-Vinci&amount=&note=PadaHub",
  devDonateVenmoWeb: "https://account.venmo.com/u/Michael-Vinci",
  privacy: "https://www.usetopscore.com/privacy-policy",
  terms: `${PADA_ORG_URL}/terms`,
  help: "https://help.ultimatecentral.com/",
  supportEmail: "mailto:support@pada.org",
  newToPada: `${PADA_ORG_URL}/new-to-pada`,
  youth: `${PADA_ORG_URL}/youth`,
  community: `${PADA_ORG_URL}/community`,
  rules: `${PADA_ORG_URL}/rules`,
  resources: `${PADA_ORG_URL}/resources`,
  about: `${PADA_ORG_URL}/about`,
  fields: `${PADA_ORG_URL}/fields`,
  schedule: `${PADA_ORG_URL}/pada-event-calendar`,
  spirit: `${PADA_ORG_URL}/spirit-reporting`,
  financials: `${PADA_ORG_URL}/about/documents/financials`,
  captainsPacket: `${PADA_ORG_URL}/captains-packet`,
  hallOfFame: `${PADA_ORG_URL}/pada-hall-of-fame`,
  volunteer: `${PADA_ORG_URL}/volunteering-for-pada`,
  scholarships: `${PADA_ORG_URL}/scholarships`,
  phillyLeagues: `${PADA_ORG_URL}/philly-leagues`,
  satelliteLeagues: `${PADA_ORG_URL}/satellite-leagues`,
} as const;