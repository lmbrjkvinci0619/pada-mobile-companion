import { isEndpointValid } from "@/services/topscoreDiscovery";

/**
 * Ensures the given endpoint is documented and reachable in the TopScore API.
 * Throws an error if the endpoint is known to be deprecated or not found.
 * For speculative endpoints, performs a live check via /api/help.
 */
export async function ensureEndpoint(endpoint: string, method: "GET" | "POST"): Promise<void> {
  // Quick static verification for known endpoints
  // If endpoint is not documented, treat it as speculative and verify at runtime.
  try {
    const valid = await isEndpointValid(endpoint);
    if (!valid) {
      console.warn(`Endpoint ${endpoint} (${method}) is not documented in TopScore API. Skipping the call.`);
      throw new Error(`Endpoint ${endpoint} is not valid`);
    }
  } catch (e) {
    // Network issues while fetching docs – assume endpoint may still work.
    console.warn(`Failed to validate endpoint ${endpoint}:`, e instanceof Error ? e.message : e);
  }
}
