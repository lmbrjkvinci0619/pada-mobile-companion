import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { User } from "@/types";
import type { ApiPerson } from "@/types/api";
import { mapPerson } from "@/lib/mappers/topscore";

// ─── User / Profile ──────────────────────────────────────────────────────────
// CONFIRMED WORKING ENDPOINTS:
// - GET  /api/persons/me                  - Current user profile
// CONFIRMED BROKEN (DO NOT USE):
// - GET  /api/persons/{id}               - Returns 404, only /api/persons/me works

export async function fetchCurrentUser(signal?: AbortSignal): Promise<User> {
  const rawData = await apiClient.getRaw<{ result?: ApiPerson | ApiPerson[]; status?: number }>("/api/persons/me", { signal });
  const result = rawData?.result;
  if (!result) {
    throw new Error("Invalid response from /api/persons/me: expected person object");
  }
  const person = Array.isArray(result) ? result[0] : result;
  if (!person || typeof person !== "object") {
    throw new Error("Invalid person data from /api/persons/me");
  }
  return mapPerson(person);
}

export async function fetchUserById(personId: string, signal?: AbortSignal): Promise<User | null> {
  // NOTE: Per actual API testing (July 2026), /api/persons/{id} returns 404.
  // The TopScore API only allows fetching the current user via /api/persons/me.
  // There is NO endpoint to fetch arbitrary user profiles by ID.
  //
  // ALTERNATIVES:
  // 1. Use searchPeople(query) to find users by name/email
  // 2. Use /api/teams/show?id=X to get roster with person details
  // 3. Use /api/events/{id}/roster to get event roster members
  //
  // This function is kept for compatibility but will always return null.
  console.warn("fetchUserById: /api/persons/{id} endpoint does not exist (404). Per API testing July 2026, only /api/persons/me is available for user data. Use searchPeople() or roster endpoints instead.");
  return null;
}

export async function updateProfile(
  personId: string,
  updates: Partial<{
    first_name: string;
    last_name: string;
    phone_number: string;
    avatar_url: string;
    about: string;
    emergency_contact: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  }>,
  signal?: AbortSignal
): Promise<User> {
  // NOTE: Per actual API testing (July 2026), /api/persons/{id} returns 404.
  // TopScore API does NOT support direct profile updates via API.
  // Profile updates must be done through the website at pada.org.
  // This function exists for API compatibility but will always fail.
  console.error("updateProfile: /api/persons/{id} endpoint does not exist (404). TopScore API does not support profile updates via API. Please update profile through the website.");
  throw new Error("Profile updates are not supported via API. Please update your profile at pada.org.");
}