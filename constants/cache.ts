export const CACHE_CONFIG = {
  defaultStaleTime: 60 * 1000,
  defaultGcTime: 5 * 60 * 1000,
  maxCacheEntries: 50,
  cacheEvictionThreshold: 0.8,
} as const;

export const STALE_TIME = {
  // Auth & User
  user: 24 * 60 * 60 * 1000,        // 24 hours - user profile rarely changes
  auth: 15 * 60 * 1000,             // 15 minutes - auth status

  // Events & Schedule
  events: 2 * 60 * 1000,            // 2 minutes - events change frequently
  schedule: 60 * 60 * 1000,         // 1 hour - team schedule
  upcomingEvents: 2 * 60 * 1000,    // 2 minutes - upcoming events
  pastEvents: 60 * 60 * 1000,       // 1 hour - past events are stable
  eventDetail: 5 * 60 * 1000,       // 5 minutes - event details
  game: 2 * 60 * 1000,              // 2 minutes - games
  standings: 6 * 60 * 60 * 1000,    // 6 hours - standings don't change often
  bracket: 6 * 60 * 60 * 1000,      // 6 hours - brackets are stable

  // Teams & Rosters
  teams: 6 * 60 * 60 * 1000,          // 6 hours - teams list
  roster: 6 * 60 * 60 * 1000,       // 6 hours - rosters rarely change
  teamDetail: 6 * 60 * 60 * 1000,   // 6 hours - team details
  teamStats: 6 * 60 * 60 * 1000,    // 6 hours - team stats
  scheduleExport: 6 * 60 * 60 * 1000, // 6 hours - schedule export

  // Registrations
  registrations: 2 * 60 * 60 * 1000, // 2 hours - registrations

  // Announcements & Articles
  announcements: 5 * 60 * 1000,     // 5 minutes - announcements
  articles: 5 * 60 * 1000,          // 5 minutes - articles

  // Attendance & Practices
  attendance: 2 * 60 * 1000,        // 2 minutes - attendance
  attendanceSurvey: 5 * 60 * 1000,  // 5 minutes - survey
  practices: 6 * 60 * 60 * 1000,    // 6 hours - practices

  // Locations
  locations: 6 * 60 * 60 * 1000,    // 6 hours - locations are stable

  // Dashboard
  dashboard: 2 * 60 * 1000,         // 2 minutes - dashboard data
} as const;

export const REQUEST_CONFIG = {
  pendingRequestTTL: 30_000,
  requestCleanupInterval: 10_000,
  maxRetries: 3,
  retryDelayBase: 1000,
  maxRetryDelay: 30_000,
} as const;