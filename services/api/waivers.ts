import { apiClient } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { Waiver, Poll, MailMessage, Practice } from "@/types";
import type { ApiWaiver, ApiPoll, ApiMailMessage, ApiPractice } from "@/types/api";
import { mapWaiver, mapPoll, mapMailMessage, mapPractice } from "@/lib/mappers/topscore";

// ─── Waivers ─────────────────────────────────────────────────────────────────

export async function fetchWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  await ensureEndpoint("/api/waivers", "GET");
  const data = await apiClient.get<ApiWaiver[]>("/api/waivers", { signal });
  return data.map(mapWaiver);
}

export async function fetchUnsignedWaivers(signal?: AbortSignal): Promise<Waiver[]> {
  await ensureEndpoint("/api/waivers?unsigned=true", "GET");
  const data = await apiClient.get<ApiWaiver[]>("/api/waivers?unsigned=true", { signal });
  return data.map(mapWaiver);
}

export async function signWaiver(
  waiverId: string,
  signature: string,
  signal?: AbortSignal
): Promise<{ success: boolean; waiver_id: string }> {
  return apiClient.post<{ success: boolean; waiver_id: string }>(
    `/api/waivers/${waiverId}/sign`,
    { signature },
    { signal }
  );
}

export async function fetchEventWaivers(
  eventId: string,
  signal?: AbortSignal
): Promise<Waiver[]> {
  await ensureEndpoint(`/api/events/${eventId}/waivers`, "GET");
  const data = await apiClient.get<ApiWaiver[]>(`/api/events/${eventId}/waivers`, { signal });
  return data.map(mapWaiver);
}

// ─── Polls / Voting ──────────────────────────────────────────────────────────

export async function fetchPolls(
  teamId?: string,
  eventId?: string,
  signal?: AbortSignal
): Promise<Poll[]> {
  let path = "/api/polls";
  const params: string[] = [];
  if (teamId) params.push(`team_id=${teamId}`);
  if (eventId) params.push(`event_id=${eventId}`);
  if (params.length > 0) path += `?${params.join("&")}`;

  await ensureEndpoint(path, "GET");
  const data = await apiClient.get<ApiPoll[]>(path, { signal });
  return data.map(mapPoll);
}

export async function fetchPoll(pollId: string, signal?: AbortSignal): Promise<Poll | null> {
  try {
    const data = await apiClient.get<ApiPoll>(`/api/polls/${pollId}`, { signal });
    return mapPoll(data);
  } catch {
    return null;
  }
}

export async function votePoll(
  pollId: string,
  optionId: number,
  signal?: AbortSignal
): Promise<{ success: boolean; votes: number }> {
  await ensureEndpoint(`/api/polls/${pollId}/vote`, "POST");
  return apiClient.post<{ success: boolean; votes: number }>(
    `/api/polls/${pollId}/vote`,
    { option_id: optionId, _method: "PUT" },
    { signal }
  );
}

export async function createPoll(
  data: {
    question: string;
    options: string[];
    team_id?: number;
    event_id?: number;
    expires_at?: string;
  },
  signal?: AbortSignal
): Promise<Poll> {
  await ensureEndpoint("/api/polls", "POST");
  const result = await apiClient.post<ApiPoll>("/api/polls", data, { signal });
  return mapPoll(result);
}

// ─── Mail / Communications ──────────────────────────────────────────────────

export async function fetchMailMessages(
  folder: "inbox" | "sent" = "inbox",
  signal?: AbortSignal
): Promise<MailMessage[]> {
  const data = await apiClient.get<ApiMailMessage[]>(`/api/mail?folder=${folder}`, { signal });
  return data.map(mapMailMessage);
}

export async function sendMailMessage(
  recipients: number[],
  subject: string,
  body: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message_id?: string }> {
  await ensureEndpoint("/api/mail/send", "POST");
  return apiClient.post<{ success: boolean; message_id?: string }>(
    "/api/mail/send",
    { recipients, subject, body },
    { signal }
  );
}

// ─── Practices ────────────────────────────────────────────────────────────────

export async function fetchPractices(
  teamId: string,
  signal?: AbortSignal
): Promise<Practice[]> {
  await ensureEndpoint(`/api/teams/${teamId}/practices`, "GET");
  const data = await apiClient.get<ApiPractice[]>(`/api/teams/${teamId}/practices`, { signal });
  return data.map(mapPractice);
}

export async function createPractice(
  teamId: string,
  practice: {
    name: string;
    start_date: string;
    end_date?: string;
    location_id?: number;
    notes?: string;
  },
  signal?: AbortSignal
): Promise<Practice> {
  await ensureEndpoint(`/api/teams/${teamId}/practices`, "POST");
  const data = await apiClient.post<ApiPractice>(
    `/api/teams/${teamId}/practices`,
    {
      name: practice.name,
      start_date: practice.start_date,
      end_date: practice.end_date,
      location_id: practice.location_id,
      notes: practice.notes,
    },
    { signal }
  );
  return mapPractice(data);
}

export async function updatePractice(
  practiceId: string,
  updates: Partial<{
    name: string;
    start_date: string;
    end_date: string;
    location_id: number;
    notes: string;
  }>,
  signal?: AbortSignal
): Promise<Practice> {
  await ensureEndpoint(`/api/practices/${practiceId}`, "POST");
  const data = await apiClient.post<ApiPractice>(
    `/api/practices/${practiceId}`,
    { ...updates, _method: "PUT" },
    { signal }
  );
  return mapPractice(data);
}

export async function deletePractice(
  practiceId: string,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/practices/${practiceId}`, "POST");
  return apiClient.post<{ success: boolean }>(`/api/practices/${practiceId}`, { _method: "DELETE" }, { signal });
}

export async function updatePracticeAttendance(
  practiceId: string,
  status: "attending" | "declined" | "maybe",
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  await ensureEndpoint(`/api/practices/${practiceId}/attendance`, "POST");
  return apiClient.post<{ success: boolean }>(
    `/api/practices/${practiceId}/attendance`,
    { status },
    { signal }
  );
}