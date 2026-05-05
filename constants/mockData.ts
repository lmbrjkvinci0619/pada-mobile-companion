// ─── Mock Data Fixtures ──────────────────────────────────────────────────────
// Swap USE_MOCK_DATA to false and set real credentials in .env to go live.

import type {
  User,
  Team,
  TeamMember,
  Event,
  Registration,
  Announcement,
} from "@/types";

export const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === "true";

// ─── Current User ────────────────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: "person-001",
  firstName: "Jamie",
  lastName: "Rivera",
  email: "jamie.rivera@example.com",
  avatarUrl: "https://i.pravatar.cc/150?u=person-001",
  role: "captain",
};

// ─── Teams ────────────────────────────────────────────────────────────────────

export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-001", personId: "person-001", firstName: "Jamie", lastName: "Rivera",
    role: "captain", jerseyNumber: "7", position: "Handler",
    avatarUrl: "https://i.pravatar.cc/150?u=person-001",
  },
  {
    id: "tm-002", personId: "person-002", firstName: "Alex", lastName: "Chen",
    role: "player", jerseyNumber: "11", position: "Cutter",
    avatarUrl: "https://i.pravatar.cc/150?u=person-002",
  },
  {
    id: "tm-003", personId: "person-003", firstName: "Morgan", lastName: "Lee",
    role: "player", jerseyNumber: "3", position: "Handler",
    avatarUrl: "https://i.pravatar.cc/150?u=person-003",
  },
  {
    id: "tm-004", personId: "person-004", firstName: "Sam", lastName: "Patel",
    role: "player", jerseyNumber: "21", position: "Deep",
    avatarUrl: "https://i.pravatar.cc/150?u=person-004",
  },
  {
    id: "tm-005", personId: "person-005", firstName: "Taylor", lastName: "Kim",
    role: "coach", jerseyNumber: undefined, position: undefined,
    avatarUrl: "https://i.pravatar.cc/150?u=person-005",
  },
  {
    id: "tm-006", personId: "person-006", firstName: "Casey", lastName: "Walsh",
    role: "player", jerseyNumber: "14", position: "Cutter",
    avatarUrl: "https://i.pravatar.cc/150?u=person-006",
  },
  {
    id: "tm-007", personId: "person-007", firstName: "Jordan", lastName: "Brooks",
    role: "player", jerseyNumber: "8", position: "Handler",
    avatarUrl: "https://i.pravatar.cc/150?u=person-007",
  },
  {
    id: "tm-008", personId: "person-008", firstName: "Riley", lastName: "Nguyen",
    role: "player", jerseyNumber: "17", position: "Hybrid",
    avatarUrl: "https://i.pravatar.cc/150?u=person-008",
  },
];

export const MOCK_TEAMS: Team[] = [
  {
    id: "team-001",
    name: "Disc Jockeys",
    division: "Mixed Open - Division A",
    sport: "Ultimate Frisbee",
    season: "Spring 2026",
    color: "#1E88E5",
    supabaseTeamId: "sb-team-001",
    captainId: "person-001",
    roster: MOCK_TEAM_MEMBERS,
  },
  {
    id: "team-002",
    name: "Sky Hammers",
    division: "Open - Division B",
    sport: "Ultimate Frisbee",
    season: "Spring 2026",
    color: "#43A047",
    supabaseTeamId: "sb-team-002",
    captainId: "person-009",
    roster: MOCK_TEAM_MEMBERS.slice(0, 5),
  },
];

// ─── Events ──────────────────────────────────────────────────────────────────

const now = new Date();
const addDays = (d: Date, n: number) =>
  new Date(d.getTime() + n * 86400000).toISOString();

export const MOCK_EVENTS: Event[] = [
  {
    id: "evt-001",
    type: "game",
    status: "scheduled",
    title: "vs. Flying Squirrels",
    startDate: addDays(now, 3),
    teamId: "team-001",
    teamName: "Disc Jockeys",
    opponentName: "Flying Squirrels",
    location: {
      id: "loc-001",
      name: "Riverside Fields - Field 2",
      address: "1400 Riverside Dr",
      city: "Portland",
      state: "OR",
      zip: "97201",
      latitude: 45.5231,
      longitude: -122.6765,
    },
    notes: "Arrive 30 minutes early for warm-up.",
  },
  {
    id: "evt-002",
    type: "practice",
    status: "scheduled",
    title: "Tuesday Practice",
    startDate: addDays(now, 1),
    teamId: "team-001",
    teamName: "Disc Jockeys",
    location: {
      id: "loc-002",
      name: "Grant Park - East Field",
      address: "2300 NE 33rd Ave",
      city: "Portland",
      state: "OR",
      zip: "97212",
      latitude: 45.5451,
      longitude: -122.6462,
    },
    notes: "Bring cones and 4 discs. Focus on stack and field positioning.",
  },
  {
    id: "evt-003",
    type: "game",
    status: "completed",
    title: "vs. Huck Yeah",
    startDate: addDays(now, -4),
    teamId: "team-001",
    teamName: "Disc Jockeys",
    opponentName: "Huck Yeah",
    location: {
      id: "loc-001",
      name: "Riverside Fields - Field 2",
      address: "1400 Riverside Dr",
      city: "Portland",
      state: "OR",
      zip: "97201",
    },
    score: {
      homeTeamName: "Disc Jockeys",
      awayTeamName: "Huck Yeah",
      homeScore: 13,
      awayScore: 9,
      reportedAt: addDays(now, -4),
      reportedBy: "Jamie Rivera",
    },
  },
  {
    id: "evt-004",
    type: "tournament",
    status: "scheduled",
    title: "PDX Spring Classic",
    startDate: addDays(now, 14),
    endDate: addDays(now, 15),
    teamId: "team-001",
    teamName: "Disc Jockeys",
    location: {
      id: "loc-003",
      name: "Oregon Sports Authority Complex",
      address: "7805 SW Martel Ave",
      city: "Portland",
      state: "OR",
      zip: "97223",
      latitude: 45.4565,
      longitude: -122.7750,
    },
    notes: "2-day tournament. Hotel info in team chat.",
  },
  {
    id: "evt-005",
    type: "game",
    status: "scheduled",
    title: "vs. Hammer Time",
    startDate: addDays(now, 10),
    teamId: "team-002",
    teamName: "Sky Hammers",
    opponentName: "Hammer Time",
    location: {
      id: "loc-004",
      name: "Columbia Park",
      address: "1880 N Lombard St",
      city: "Portland",
      state: "OR",
      zip: "97217",
    },
  },
  {
    id: "evt-006",
    type: "game",
    status: "in_progress",
    title: "vs. Wind Dancers",
    startDate: new Date().toISOString(),
    teamId: "team-001",
    teamName: "Disc Jockeys",
    opponentName: "Wind Dancers",
    location: {
      id: "loc-001",
      name: "Riverside Fields - Field 2",
      address: "1400 Riverside Dr",
      city: "Portland",
      state: "OR",
      zip: "97201",
    },
    score: {
      homeTeamName: "Disc Jockeys",
      awayTeamName: "Wind Dancers",
      homeScore: 7,
      awayScore: 6,
      reportedAt: new Date().toISOString(),
      reportedBy: "Jamie Rivera",
    },
  },
];

// ─── Registrations ────────────────────────────────────────────────────────────

export const MOCK_REGISTRATIONS: Registration[] = [
  {
    id: "reg-001",
    type: "team",
    status: "active",
    organizationName: "Pada.org - Portland Ultimate",
    seasonName: "Spring 2026",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    teamId: "team-001",
  },
  {
    id: "reg-002",
    type: "league",
    status: "active",
    organizationName: "Portland Ultimate League - Mixed Division A",
    seasonName: "Spring 2026",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    leagueId: "league-001",
  },
  {
    id: "reg-003",
    type: "team",
    status: "active",
    organizationName: "Pada.org - Portland Ultimate",
    seasonName: "Spring 2026",
    startDate: "2026-03-01",
    endDate: "2026-06-30",
    teamId: "team-002",
  },
  {
    id: "reg-004",
    type: "event",
    status: "active",
    organizationName: "PDX Spring Classic 2026",
    startDate: addDays(now, 14),
    endDate: addDays(now, 15),
    eventId: "evt-004",
  },
  {
    id: "reg-005",
    type: "team",
    status: "completed",
    organizationName: "Pada.org - Portland Ultimate",
    seasonName: "Fall 2025",
    startDate: "2025-09-01",
    endDate: "2025-12-15",
    teamId: "team-001",
  },
];

// ─── Announcements ────────────────────────────────────────────────────────────

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    title: "⚠️ Field Change — May 3rd Game",
    content:
      "The game on May 3rd has been moved from Riverside Fields to Grant Park (East Field) due to field maintenance. Please update your directions accordingly. Game time remains the same: 6:30 PM.",
    authorId: "admin-001",
    authorName: "Portland Ultimate League Admin",
    authorRole: "league_admin",
    targetType: "league",
    targetId: "league-001",
    isUrgent: true,
    isRead: false,
    createdAt: addDays(now, -1),
  },
  {
    id: "ann-002",
    title: "PDX Spring Classic — Roster Confirmation",
    content:
      "All teams attending the PDX Spring Classic must confirm their roster by April 30th. Please ensure all players have completed their waivers on the website. Contact the league admin if you have any questions.",
    authorId: "admin-001",
    authorName: "Portland Ultimate League Admin",
    authorRole: "league_admin",
    targetType: "league",
    targetId: "league-001",
    isUrgent: false,
    isRead: false,
    createdAt: addDays(now, -2),
  },
  {
    id: "ann-003",
    title: "Team Strategy Session — Thursday",
    content:
      "Disc Jockeys: we're holding an optional film review and strategy session this Thursday at 7pm. We'll review last week's game footage and go over our flow offense sets for the tournament. Pizza will be provided 🍕",
    authorId: "person-001",
    authorName: "Jamie Rivera",
    authorRole: "team_captain",
    targetType: "team",
    targetId: "team-001",
    isUrgent: false,
    isRead: true,
    createdAt: addDays(now, -3),
  },
  {
    id: "ann-004",
    title: "Spring League Schedule Published",
    content:
      "The full Spring 2026 season schedule is now available on the website. Games run Tuesday and Thursday evenings, 6:30 PM start. Check the schedule tab in the app for your specific matchups. Good luck to all teams!",
    authorId: "admin-001",
    authorName: "Portland Ultimate League Admin",
    authorRole: "league_admin",
    targetType: "league",
    targetId: "league-001",
    isUrgent: false,
    isRead: true,
    createdAt: addDays(now, -7),
  },
];

// ─── Announcements ─────────────────────────────────────────────────────────────
