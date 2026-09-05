import { apiClient } from "@/lib/apiClient";
import { ensureEndpoint } from "@/lib/endpointGuard";
import type { EventStatus } from "@/types";

// ─── Score Reporting ──────────────────────────────────────────────────────────

export async function reportScore(
  gameId: string,
  homeScore: number,
  awayScore: number,
  isOvertime: boolean = false,
  status?: EventStatus,
  signal?: AbortSignal
): Promise<{ success: boolean; score_id?: string }> {
  if (!gameId) {
    throw new Error("gameId is required");
  }
  if (homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative");
  }
  const payload: Record<string, unknown> = {
    game_id: gameId,
    home_score: homeScore,
    away_score: awayScore,
    is_overtime: isOvertime,
  };

  if (status === "completed") {
    payload.is_final = true;
  }

  return apiClient.post<{ success: boolean; score_id?: string }>(
    "/api/games/report-score",
    payload,
    { signal }
  );
}

export async function updateScore(
  gameId: string,
  homeScore: number,
  awayScore: number,
  isOvertime: boolean = false,
  status?: EventStatus,
  signal?: AbortSignal
): Promise<{ success: boolean }> {
  if (!gameId) {
    throw new Error("gameId is required");
  }
  if (homeScore < 0 || awayScore < 0) {
    throw new Error("Scores must be non-negative");
  }
  await ensureEndpoint("/api/games/report-score", "POST");
  const payload: Record<string, unknown> = {
    game_id: gameId,
    home_score: homeScore,
    away_score: awayScore,
    is_overtime: isOvertime,
  };

  if (status === "completed") {
    payload.is_final = true;
  }

  return apiClient.post<{ success: boolean }>(
    "/api/games/report-score",
    { ...payload, _method: "PUT" },
    { signal }
  );
}