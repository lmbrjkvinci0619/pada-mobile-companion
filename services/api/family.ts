import { apiClient } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Family, Membership } from "@/types";
import type { ApiFamily, ApiMembership } from "@/types/api";
import { mapFamily, mapMembership } from "@/lib/mappers/topscore";

// ─── Family ──────────────────────────────────────────────────────────────────

export async function fetchFamily(signal?: AbortSignal): Promise<Family | null> {
  try {
    await ensureEndpoint("/api/family", "GET");
    const data = await apiClient.get<ApiFamily>("/api/family", { signal });
    return mapFamily(data);
  } catch (e) {
    console.warn("fetchFamily failed:", e);
    return null;
  }
}

export async function addFamilyMember(
  email: string,
  relationship: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message: string }> {
  await ensureEndpoint("/api/family/invite", "POST");
  const data = await apiClient.post<{ success: boolean; message: string }>(
    "/api/family/invite",
    { email, relationship },
    { signal }
  );
  return data;
}

export async function removeFamilyMember(
  personId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/family/${personId}`, "POST");
  return apiClient.post<{ success: boolean }>(`/api/family/${personId}`, { _method: "DELETE" }, { signal });
}

// ─── Memberships ─────────────────────────────────────────────────────────────

export async function fetchMemberships(signal?: AbortSignal): Promise<Membership[]> {
  await ensureEndpoint("/api/memberships", "GET");
  const data = await apiClient.get<ApiMembership[]>("/api/memberships", { signal });
  return data.map(mapMembership);
}

export async function purchaseMembership(
  membershipType: string,
  paymentToken: string,
  signal?: AbortSignal
): Promise<{ success: boolean; membership_id?: string; error?: string }> {
  await ensureEndpoint("/api/memberships/purchase", "POST");
  return apiClient.post<{ success: boolean; membership_id?: string; error?: string }>(
    "/api/memberships/purchase",
    { type: membershipType, payment_token: paymentToken },
    { signal }
  );
}