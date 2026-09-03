/**
 * TopScore API Validation Utilities
 *
 * Thin wrapper around lib/endpointCatalog.ts.
 * Endpoint data and lookup logic are centralized there; this module
 * re-exports the public API for backward compatibility.
 *
 * Per TopScore API spec v1.0 (docs/topscore_api.md).
 */

import type { TopScoreError } from "@/types/api-response";
import {
  ENDPOINT_CATALOG,
  getEndpointRecord,
  describeEndpoint,
  isEndpointVerified,
  isEndpointSpeculative,
  type EndpointRecord,
} from "./endpointCatalog";

export type EndpointVerificationStatus = "VERIFIED" | "SPECULATIVE" | "DEPRECATED";

export interface EndpointDoc {
  path: string;
  method: "GET" | "POST";
  description: string;
  verificationStatus: EndpointVerificationStatus;
  notes?: string;
}

export const ENDPOINT_DOCUMENTATION: EndpointDoc[] = ENDPOINT_CATALOG.map((rec) => ({
  path: rec.path,
  method: rec.method,
  description: rec.notes ?? rec.path,
  verificationStatus:
    rec.status === "DEPRECATED"
      ? "DEPRECATED"
      : rec.status === "VERIFIED"
      ? "VERIFIED"
      : "SPECULATIVE",
  notes: rec.notes,
}));

export { getEndpointRecord, describeEndpoint };

export function getEndpointStatus(
  path: string,
  method: "GET" | "POST"
): EndpointVerificationStatus {
  const rec = getEndpointRecord(path, method);
  if (!rec) return "SPECULATIVE";
  if (rec.status === "DEPRECATED") return "DEPRECATED";
  if (rec.status === "VERIFIED") return "VERIFIED";
  return "SPECULATIVE";
}

export function isVerifiedEndpoint(
  path: string,
  method: "GET" | "POST"
): boolean {
  return isEndpointVerified(path, method);
}

export function needsVerification(
  path: string,
  method: "GET" | "POST"
): boolean {
  return isEndpointSpeculative(path, method);
}

/**
 * Validate API response structure per spec §5.
 */
export function validateApiResponse(
  response: unknown
): { valid: boolean; error?: string } {
  if (response === null || response === undefined) {
    return { valid: false, error: "Response is null or undefined" };
  }
  if (typeof response !== "object") {
    return { valid: false, error: "Response is not an object" };
  }
  const r = response as Record<string, unknown>;
  if (!("status" in r)) {
    return { valid: false, error: "Response missing 'status' field" };
  }
  if (typeof r.status !== "number") {
    return { valid: false, error: "Response 'status' is not a number" };
  }
  if (!("errors" in r)) {
    return { valid: false, error: "Response missing 'errors' field" };
  }
  if (!Array.isArray(r.errors)) {
    return { valid: false, error: "Response 'errors' is not an array" };
  }
  return { valid: true };
}

/**
 * Validate error response.
 */
export function validateErrorResponse(
  response: unknown
): response is { status: number; errors: TopScoreError[] } {
  if (!validateApiResponse(response).valid) return false;
  const r = response as Record<string, unknown>;
  const status = r.status;
  const statusNum =
    typeof status === "number"
      ? status
      : typeof status === "string"
      ? parseInt(status, 10)
      : NaN;
  return statusNum >= 400 && Array.isArray(r.errors) && r.errors.length > 0;
}

/**
 * Get user-friendly message from TopScore error.
 */
export function getErrorMessageFromResponse(response: unknown): string {
  if (!response || typeof response !== "object") {
    return "Unknown error";
  }
  const r = response as Record<string, unknown>;

  if (Array.isArray(r.errors) && r.errors.length > 0) {
    const firstError = r.errors[0] as Record<string, unknown>;
    if (typeof firstError.message === "string") {
      return firstError.message;
    }
  }

  if (typeof r.message === "string") {
    return r.message;
  }

  if (typeof r.error === "string") {
    return r.error;
  }

  if (typeof r.error_description === "string") {
    return r.error_description;
  }

  return "Unknown error";
}