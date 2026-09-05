// Re-export all domain modules for backward compatibility
export * from "./user";
export * from "./teams";
export * from "./events";
export * from "./registrations";
export * from "./articles";
export * from "./score";
export * from "./family";
export * from "./waivers";
export * from "./search";
export * from "./dashboard";

// Types
export type {
  FetchTeamsOptions,
} from "./teams";

export type {
  FetchEventsOptions,
  FetchGamesOptions,
} from "./events";

export type {
  FetchRegistrationsOptions,
} from "./registrations";

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