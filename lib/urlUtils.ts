import { Linking } from "react-native";
import { TOPSCORE_BASE_URL, PADA_ORG_URL } from "@/constants/config";

/**
 * Constructs a TopScore URL from a path.
 *
 * IMPORTANT: TopScore API has two URL conventions:
 * 1. Base URL without /api suffix (RECOMMENDED): https://pada.usetopscore.com
 *    - Paths should include /api prefix: /api/events
 * 2. Base URL with /api suffix: https://pada.usetopscore.com/api
 *    - Paths should NOT include /api prefix: /events
 *
 * This function handles BOTH conventions by checking if the base URL already
 * contains /api. If it does, we strip the /api from paths to avoid duplication.
 * If it doesn't, we ensure paths start with /api.
 */
export function getTopScoreUrl(path: string): string {
  const base = TOPSCORE_BASE_URL.endsWith("/api")
    ? TOPSCORE_BASE_URL.slice(0, -3)
    : TOPSCORE_BASE_URL.endsWith("/api/")
    ? TOPSCORE_BASE_URL.slice(0, -4)
    : TOPSCORE_BASE_URL;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const hasApiInBase = TOPSCORE_BASE_URL.includes("/api");
  if (hasApiInBase) {
    if (normalizedPath.startsWith("/api")) {
      return `${base}${normalizedPath}`;
    }
    return `${base}/api${normalizedPath}`;
  }

  if (!normalizedPath.startsWith("/api")) {
    return `${base}/api${normalizedPath}`;
  }
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
    return getTopScoreUrl(`/events/${eventId}`);
  }
  if (teamId) {
    return getTopScoreUrl(`/teams/${teamId}`);
  }
  if (leagueId) {
    return getTopScoreUrl(`/leagues/${leagueId}`);
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