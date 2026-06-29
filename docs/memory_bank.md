# PadaHub Mobile Companion – Memory Bank

---

## 1. Project Overview
- **Name**: PadaHub (Mobile Companion)
- **Purpose**: Official iOS/Android companion app for Pada.org, providing league/team viewing, real‑time chat, announcements, and captain‑only live‑score reporting.
- **Core concepts**: OAuth2 authentication via TopScore, optional mock‑data mode for UI development, Supabase‑backed real‑time features, TanStack Query for data fetching, Zustand for global auth/setting stores.

---

## 2. Tech Stack
| Layer | Technology | Version |
|------|------------|---------|
| Runtime | **React Native** (0.81.5) + **Expo** (~54.0.33) |
| UI | **NativeWind** (Tailwind preset), **Expo‑Google‑Fonts** (Inter) |
| State | **Zustand** (5.0.12) |
| Data fetching | **@tanstack/react-query** (5.100.9) |
| Language | **TypeScript** (~5.9.2) |
| Backend services | **TopScore API** (OAuth2) – read‑only; **Supabase** (PostgreSQL + Edge Functions) |
| Storage | **expo‑secure‑store**, **@react-native‑async‑storage** |
| Notifications | **expo‑notifications** (push via Expo push service) |
| Testing | **jest**, **detox**, **maestro** |
| Build & Deploy | **eas-cli**, **expo‑prebuild** |

---

## 3. Environment Variables & Configuration
### .env.example
```
EXPO_PUBLIC_TOPSCORE_CLIENT_ID=your_topscore_client_id
EXPO_PUBLIC_TOPSCORE_CLIENT_SECRET=your_topscore_client_secret
EXPO_PUBLIC_TOPSCORE_BASE_URL=https://pada.usetopscore.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-jwt-anon-key
```
### constants/config.ts (runtime defaults & constants)
- `TOPSCORE_BASE_URL` – fallback to `https://pada.usetopscore.com`
- `TOPSCORE_OAUTH_URL` – `${TOPSCORE_BASE_URL}/api/oauth/server`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` – pulled from env.
- Cache TTLs (userProfile 24h, schedule 1h, roster 6h, registrations 2h, teams 6h).
- `SESSION_DURATION_DAYS = 30`
- Pagination `PAGE_SIZE = 20`
- Brand strings (`APP_NAME = "PadaHub"`, `APP_VERSION = "1.0.0"`)
- Sport constants (`SPORT_NAME = "Ultimate Frisbee"`, `SPORT_EMOJI = "🥏"`).

---

## 4. Mock Data Mode
- Flag: `USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === "true"` (defined in `constants/mockData.ts`).
- When enabled, **all TopScore service calls** return static fixtures defined in the same file:
  - `MOCK_USER`, `MOCK_TEAMS`, `MOCK_TEAM_MEMBERS`, `MOCK_EVENTS`, `MOCK_REGISTRATIONS`, `MOCK_ANNOUNCEMENTS`, `MOCK_ARTICLES`.
- UI warns with a yellow banner (`MockDataWarning` component) when active.

---

## 5. Authentication & Authorization
### OAuth2 Flow (`services/auth.ts`)
1. `loginWithCredentials(email, password, rememberMe)` posts form‑urlencoded body to `TOPSCORE_OAUTH_URL` with client_id/secret.
2. On success stores `accessToken`, optional `refreshToken`, and calculated `expiresAt`.
   - If `rememberMe` → `SecureStore` (`padahub_tokens`); else kept in-memory (`memoryTokens`).
3. Rate‑limit per email using helpers in `lib/validation` (not shown here). Excess attempts return a friendly message.
4. Token refresh (`getValidAccessToken`) uses stored refresh token; on failure clears credentials.
5. `saveTokens`, `loadTokens`, `clearTokens`, `saveUser`, `loadUser` all use `expo-secure-store` with keys `padahub_tokens` & `padahub_user`.

### Auth Store (`store/authStore.ts`)
- Zustand store exposing `user`, `isAuthenticated`, `isLoading`, `error` plus actions `initialize`, `login`, `logout`, `refreshUser`.
- On app start (`initialize`) it loads cached tokens/user, validates, optionally fetches fresh user via `fetchCurrentUser`.
- `logout` clears tokens, query cache, API cache, push token registrations, and rate‑limit data.

---

## 6. State Management
- **Auth Store** – holds current user & auth flags.
- **Settings Store** (`store/settingsStore.ts`) – notification preferences, display settings, onboarding status, sync timestamps, async actions for loading/saving preferences via Supabase (`services/announcements.ts`).
- **Query Client** – singleton `queryClient` (imported from `lib/queryClient.ts`) passed to `QueryClientProvider` in `_layout.tsx`.

---

## 7. API Integration – TopScore (`services/topscore.ts`)
- Central façade exposing async functions for every TopScore endpoint:
  - `fetchCurrentUser`, `fetchUserById`, `updateProfile`
  - Team operations: `fetchTeams`, `fetchTeam`, `fetchTeamRoster`, `updateTeamMemberRole`, `removeTeamMember`
  - Event operations: `fetchEvents`, `fetchEvent`, `fetchUpcomingEvents`, `fetchPastEvents`, `fetchEventAttendance`, `reportScore`, `updateScore`
  - Registrations, Articles, Waivers, Polls, Mail, Notifications, Brackets, Attendance Surveys, Roster Management, etc.
- Each call routes through **apiClient** and uses `isMockEnabled()` to return fixtures when mock mode is active.
- Helper “parallel” fetch functions (`fetchDashboardData`, `fetchTeamDetailData`, `fetchEventDetailData`) combine multiple calls with `Promise.all` for UI dashboards.

---

## 8. API Client (`lib/apiClient.ts`)
- Base URL from `TOPSCORE_BASE_URL`.
- Automatic **Auth header** injection via `getValidAccessToken`.
- **GET** requests are cached for 60 s (`responseCache`). In‑flight deduplication via `inFlightRequests` map.
- Retries: up to 2 retries with exponential back‑off (`RETRY_DELAY_BASE = 1000ms`).
- Errors wrapped in custom classes (`ApiError`, `AuthError`, `NetworkError`).
- Exported helpers: `apiClient.{get,post,put,delete}`, `isMockEnabled()`, `batchRequests()`, `clearCache()`, `invalidateCache(pattern?)`.

---

## 9. Data Fetching Hooks (`hooks/useApi.ts`)
- Provides typed React Query hooks for each top‑level service function.
- Example: `useUser`, `useTeams`, `useTeam(teamId)`, `useEvents(teamId?)`, `useUpcomingEvents`, `usePastEvents`, `useRegistrations`, `useAnnouncements(userId)`, `useNotifications`, `useDashboard`.
- Mutation hooks (`useMutations.ts`) for creating announcements and marking them read, with optimistic UI updates.

---

## 10. Announcement Service (`services/announcements.ts`)
- **Local hide state** stored in `AsyncStorage` (`hidden_announcements`). Functions: `hideAnnouncement`, `unhideAnnouncement`, `isAnnouncementHidden`, `clearHiddenAnnouncements`.
- **Fetching** (`fetchAnnouncements(userId)`) joins Supabase `team_members` to resolve the user's team IDs, then queries the `announcements` table with:
  - Visibility filter (`expires_at` null or future)
  - Target filter (league/division/team based on the user’s teams)
  - Excludes hidden IDs.
- Returns pagination‑compatible object with `data` array and `pagination` meta.
- **Mark read** – upserts a row in `announcement_reads`.
- **Create** – invokes Supabase Edge Function `create-announcement` with a TopScore token for auth.
- **Sync preferences** – writes user notification preferences to `user_preferences`.
- **Push token management** – register/unregister tokens in `user_push_tokens`.

---

## 11. Notification Service (`services/notifications.ts`)
- Handles permission flow (`getNotificationPermissionStatus`, `requestNotificationPermission`).
- Registers push token via `registerPushToken` (Supabase upsert).
- Sets Android notification channels (`default`, `urgent`, `announcements`).
- Provides helpers to schedule/cancel local notifications, set badge count, and observe notification responses.
- Exposes React hooks `useNotificationObserver`, `useNotificationPermissions`.

---

## 12. Supabase Backend
### Schema (`supabase/schema.sql`)
- Tables: `teams`, `team_members`, `messages`, `message_reactions`, `pinned_messages`, `announcements`, `announcement_reads`, `user_preferences`, `user_push_tokens`.
- Row‑Level Security (RLS) policies: public SELECT on messages/announcements, inserts blocked (must use Edge Functions), fine‑grained policies on reads, preferences, push tokens tied to JWT `topscore_person_id` claim.
- Indexes for target filtering and performance.

### Edge Functions
1. **create-announcement** (`supabase/functions/create-announcement/index.ts`)
   - Validates required fields.
   - Verifies TopScore token via `/api/persons/me`.
   - Checks permission: team captain for team target, league admin for league/division, special rule for `pada_org` announcements.
   - Inserts into `announcements` table and returns created row.
2. **notify-urgent-announcement** (`supabase/functions/notify-urgent-announcement/index.ts`)
   - Receives the newly created announcement record.
   - Resolves target users (team members, division members, league‑wide) via joins.
   - Reads notification preferences & quiet‑hour settings.
   - Sends push notifications via Expo push service using `EXPO_ACCESS_TOKEN`.
   - Computes badge count based on unread announcements.

---

## 13. UI Component Library (`components/ui/`)
| Component | Description |
|----------|-------------|
| `Button.tsx` | Styled pressable, uses Tailwind classes.
| `Avatar.tsx` | Displays circular image or initials.
| `Badge.tsx` | Small label with color variants.
| `Card.tsx` | Container with elevation and rounded corners.
| `ReadOnlyBanner.tsx` | Banner for read‑only or development notices.
| `Badge.tsx`, `Avatar.tsx` etc. – all built with the `cn` utility (`utils/cn.ts`).

---

## 14. Styling (`tailwind.config.js`)
- Content paths include `App.{js,jsx,ts,tsx}` and all files under `app/` & `components/`.
- Preset: `nativewind/preset`.
- Custom color palette: `primary`, `accent`, `warning`, `danger`, `surface`, `bg`, `txt` with multiple shades.
- Font families map to Inter weight variants (`Inter_400Regular` → `sans`, `Inter_500Medium` → `mid`, etc.).
- Extended border radius, spacing tokens, etc.

---

## 15. Routing & Layout (`app/`)
- **File‑based routing** via Expo Router.
- Root layout (`_layout.tsx`):
  - Loads global CSS, custom fonts.
  - Validates critical env vars (`TOPSCORE_BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
  - Shows a **Mock Data warning** banner when applicable.
  - Initializes auth store, registers for push notifications, sets up listeners to navigate to announcements on tap.
  - Provides an `ErrorBoundary` for runtime errors.
- Example screens: `app/(auth)/login.tsx`, `app/announcements/index.tsx`, `app/announcements/[id].tsx`, `app/teams/[id]/index.tsx`, `app/settings/profile.tsx`, `app/settings/notifications.tsx`, `app/debug/ui-gallery.tsx`.

---

## 16. Build & Deployment
- **npm scripts** (`package.json`):
  - `start` – `expo start`
  - `android` / `ios` – run on respective emulators
  - `web` – `expo start --web`
  - `test` – `jest`
  - `test:e2e` – Maestro test runner, `test:e2e:all` for all.
  - `detox:*` – build/run Detox iOS tests.
- **EAS** (`eas.json` present) – used for production builds and OTA updates.
- **Pre‑build** steps: `npx expo prebuild` then native builds.

---

## 17. Testing
- **Jest** – unit tests under `__tests__` (e.g., `components/ui/__tests__/Button.test.tsx`, `services/__tests__/topscore.test.ts`).
- **Detox** – native end‑to‑end tests (`e2e/login-flow.yaml`).
- **Maestro** – lightweight e2e harness for CI.

---

## 18. Project Structure (high‑level tree)
```
📦 pada-mobile-companion
├─ 📂 app               # Expo Router screens & layout
│   ├─ _layout.tsx
│   ├─ (auth)/login.tsx
│   ├─ announcements/
│   │   ├─ index.tsx
│   │   └─ [id].tsx
│   ├─ teams/[id]/index.tsx
│   ├─ settings/
│   │   ├─ profile.tsx
│   │   └─ notifications.tsx
│   └─ debug/ui-gallery.tsx
├─ 📂 components        # Reusable UI components
│   └─ ui/
│       ├─ Avatar.tsx
│       ├─ Badge.tsx
│       ├─ Button.tsx
│       ├─ Card.tsx
│       ├─ ReadOnlyBanner.tsx
│       └─ index.ts
├─ 📂 constants        # Config & mock fixtures
│   ├─ config.ts
│   ├─ mockData.ts
│   └─ index.ts
├─ 📂 services         # API wrappers, auth, announcements, notifications
│   ├─ auth.ts
│   ├─ topscore.ts
│   ├─ announcements.ts
│   ├─ notifications.ts
│   └─ preferences.ts (used by settings store)
├─ 📂 store            # Zustand stores (auth, settings)
│   ├─ authStore.ts
│   └─ settingsStore.ts
├─ 📂 lib              # Core utilities
│   ├─ apiClient.ts
│   ├─ errors.ts
│   ├─ queryClient.ts
│   ├─ queryKeys.ts
│   ├─ mappers/
│   │   └─ topscore.ts (response → internal models)
│   └─ validation.ts (rate‑limit, sanitisation)
├─ 📂 hooks            # React‑Query wrappers and mutation helpers
│   ├─ useApi.ts
│   └─ useMutations.ts
├─ 📂 supabase         # Schema and Edge Functions
│   ├─ schema.sql
│   └─ functions/
│       ├─ create-announcement/index.ts
│       └─ notify-urgent-announcement/index.ts
├─ 📂 utils            # Small helpers
│   └─ cn.ts
├─ 📂 __tests__        # Jest test suites
├─ 📂 __mocks__        # Mock modules for testing
├─ 📂 docs
│   └─ memory_bank.md   # **(this file)**
├─ .env, .env.example
├─ tailwind.config.js
├─ package.json, tsconfig.json, metro.config.js
└─ README.md
```

---

## 19. Key Files – Short Descriptions
| File | Role |
|------|------|
| `app/_layout.tsx` | Global layout, font loading, auth init, push registration, error boundary. |
| `store/authStore.ts` | Auth Zustand store – holds user, auth state, login/logout logic. |
| `services/auth.ts` | SecureStore token handling, OAuth login, token refresh, credential clearing. |
| `constants/config.ts` | Central config (API URLs, cache TTLs, app metadata). |
| `constants/mockData.ts` | Fixture data for development mode. |
| `services/topscore.ts` | Wrapper around TopScore REST endpoints, uses `apiClient`. |
| `lib/apiClient.ts` | HTTP client with caching, retry, token injection, mock‑mode guard. |
| `hooks/useApi.ts` | TanStack Query hooks for all TopScore data queries. |
| `hooks/useMutations.ts` | Mutations for announcements (create, mark read). |
| `services/announcements.ts` | Announcement CRUD, hidden‑announcement handling, push token sync, preference sync. |
| `services/notifications.ts` | Push permission flow, channel setup, token registration, local scheduling. |
| `supabase/schema.sql` | Database tables & RLS policies for chat, announcements, preferences. |
| `supabase/functions/create-announcement/index.ts` | Edge function to create announcements with auth checks. |
| `supabase/functions/notify-urgent-announcement/index.ts` | Sends push notifications for urgent announcements respecting user prefs. |
| `components/ui/*.tsx` | Core UI primitives (Button, Avatar, Card, Badge, ReadOnlyBanner). |
| `utils/cn.ts` | Simple Tailwind class‑name concatenation helper. |
| `tailwind.config.js` | Tailwind theme customisation used by NativeWind. |
| `package.json` | Scripts, dependencies, devDependencies. |
| `README.md` | High‑level project description & run instructions. |

---

## 20. Known Limitations / TODO (as of 2026‑06‑28)
- No explicit offline‑sync for TopScore data beyond query cache – could add background refresh.
- Rate‑limit logic lives in `lib/validation` (not examined here) – ensure it is unit‑tested.
- UI does not currently expose a dark‑mode toggle; relies on system setting.
- End‑to‑end test coverage for push notification handling is minimal.
- Documentation for Edge Function deployment steps could be expanded.

---

*This memory bank is intended for AI agents to quickly locate architecture, configuration, and key implementation details across the PadaHub mobile codebase.*
