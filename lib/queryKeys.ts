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
    byTeam: (teamId: string) => ["events", "team", teamId] as const,
    byId: (id: string) => ["events", "id", id] as const,
  },
  teams: {
    all: ["teams", "all"] as const,
    byId: (id: string) => ["teams", "id", id] as const,
  },
  registrations: {
    all: ["registrations", "all"] as const,
    byId: (id: string) => ["registrations", "id", id] as const,
  },
  announcements: {
    all: (userId: string) => ["announcements", "all", userId] as const,
    byId: (id: string) => ["announcements", "id", id] as const,
  },
} as const;

export type QueryKey = typeof queryKeys;