// Main TopScore API - re-exports from domain modules for backward compatibility
// This file maintains the same public API while delegating to organized domain modules

import { apiClient, buildFieldsParam, MAX_PER_PAGE } from "@/lib/apiClient";
export { apiClient, buildFieldsParam, MAX_PER_PAGE };

// Re-export all domain modules
export * from "./api/user";
export * from "./api/teams";
export * from "./api/events";
export * from "./api/registrations";
export * from "./api/articles";
export * from "./api/score";
export * from "./api/family";
export * from "./api/waivers";
export * from "./api/search";
export * from "./api/dashboard";

// Types
export type {
  FetchTeamsOptions,
} from "./api/teams";

export type {
  FetchEventsOptions,
  FetchGamesOptions,
} from "./api/events";

export type {
  FetchRegistrationsOptions,
} from "./api/registrations";

export type { PaginatedResponse } from "@/types/api-response";

// Re-export mappers
export {
  mapPerson,
  mapRegistration,
  mapTeam,
  mapEvent,
  mapGame,
  mapArticle,
  mapScheduleExport,
  mapStandings,
  mapStandingEntry,
  mapEventAttendance,
  mapPractice,
  mapWaiver,
  mapFamily,
  mapMembership,
  mapNotification,
  mapPoll,
  mapMailMessage,
  mapBracket,
  mapRosterMember,
  mapRoster,
  mapLocation,
} from "@/lib/mappers/topscore";