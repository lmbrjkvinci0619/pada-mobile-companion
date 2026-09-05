export const queryKeys = {
  auth: {
    user: ["auth", "user"] as const,
  },
  user: {
    current: ["user", "current"] as const,
    byId: (id: string) => ["user", id] as const,
  },
  events: {
    all: ["events", "all"] as const,
    byTeam: (teamId: string, filter?: "upcoming" | "past") => ["events", "team", teamId, ...(filter ? [filter] : [])] as const,
    byId: (id: string) => ["events", "id", id] as const,
    standings: (eventId: string) => ["events", eventId, "standings"] as const,
    attendance: (eventId: string) => ["events", eventId, "attendance"] as const,
    attendanceSurvey: (eventId: string) => ["events", eventId, "attendance_survey"] as const,
    roster: (eventId: string) => ["events", eventId, "roster"] as const,
    bracket: (eventId: string) => ["events", eventId, "bracket"] as const,
  },
  teams: {
    all: ["teams", "all"] as const,
    byId: (id: string) => ["teams", "id", id] as const,
    roster: (teamId: string) => ["teams", teamId, "roster"] as const,
    standingRoster: (teamId: string) => ["teams", teamId, "standing_roster"] as const,
    activeRoster: (teamId: string) => ["teams", teamId, "active_roster"] as const,
    stats: (teamId: string) => ["teams", teamId, "stats"] as const,
    standings: (teamId: string) => ["teams", teamId, "standings"] as const,
    scheduleExport: (teamId: string) => ["teams", teamId, "schedule_export"] as const,
  },
  registrations: {
    all: ["registrations", "all"] as const,
    byId: (id: string) => ["registrations", "id", id] as const,
    byPerson: (personId: string) => ["registrations", "person", personId] as const,
    byTeam: (teamId: string) => ["registrations", "team", teamId] as const,
    byEvent: (eventId: string) => ["registrations", "event", eventId] as const,
  },
  announcements: {
    all: (userId: string) => ["announcements", "all", userId] as const,
    byId: (id: string) => ["announcements", "id", id] as const,
  },
  articles: {
    all: ["articles", "all"] as const,
    bySlug: (slug: string) => ["articles", "slug", slug] as const,
  },
  games: {
    all: (eventId: string) => ["games", eventId] as const,
    byId: (gameId: string) => ["games", "id", gameId] as const,
  },
  locations: {
    all: (organizationId?: number) => ["locations", organizationId ?? "all"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    teamDetail: (teamId: string) => ["team", teamId, "detail"] as const,
    eventDetail: (eventId: string) => ["event", eventId, "detail"] as const,
  },
} as const;

export type QueryKey = typeof queryKeys;