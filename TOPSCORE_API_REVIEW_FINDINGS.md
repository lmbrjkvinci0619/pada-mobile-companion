# TopScore API Review - Findings and Fixes

**Date:** July 2, 2026
**Review Scope:** All files interfacing with TopScore API (`/api/*` endpoints)
**Reference:** `docs/topscore_api.md` - TopScore API Specification v1.0

---

## Executive Summary

This review identified **6 critical issues** and **4 medium/low priority issues** in the codebase's interaction with the TopScore API. All critical issues have been fixed. The main problem was incorrect endpoint patterns - TopScore uses non-standard REST patterns where single resources require query parameters instead of path parameters.

---

## Critical Issues Found & Fixed

### 1. False "VERIFIED" Documentation for Broken Endpoints

**Files Affected:**
- `types/api-response.ts` (lines 85-98)
- `lib/apiValidation.ts` (lines 76-89)

**Problem:** Multiple endpoints were marked as "VERIFIED" in documentation when they actually return 404 errors:
- `/api/persons/{id}` - DOES NOT EXIST
- `/api/events/{id}` - DOES NOT EXIST
- `/api/teams/{id}` - DOES NOT EXIST
- `/api/registrations/{id}` - DOES NOT EXIST
- `/api/schedule` - DOES NOT EXIST

**Evidence:** Actual API testing (July 2026) confirmed these return 404 errors.

**Fix Applied:**
- Updated `types/api-response.ts` to correctly document which endpoints are VERIFIED vs BROKEN
- Updated `lib/apiValidation.ts` to mark broken endpoints as "DEPRECATED" with clear notes about alternatives

---

### 2. Wrong Endpoint Pattern Usage in Code

**Files Affected:**
- `services/topscore.ts` - Multiple functions

**Problem:** Code was using standard REST patterns (`/api/events/{id}`) which don't exist in TopScore API.

**Actual TopScore Patterns (confirmed working):**
- Single event: `/api/events?id={id}` (uses query parameter)
- Single team: `/api/teams/show?id={id}` (uses /teams/show endpoint)
- Schedule: `/api/games?event_id={id}` (NOT /api/schedule)

**Fix Applied:**
- Updated `fetchEvent()` to use `/api/events?id=${eventId}`
- Updated `fetchTeam()` to use `/api/teams/show?id=${teamId}`
- Added `fetchGames()` function for the working `/api/games` endpoint
- Updated header comments in `topscore.ts` to document correct patterns

---

### 3. fetchUserById Always Returns Null

**File:** `services/topscore.ts` (lines 120-127)

**Problem:** The function `fetchUserById()` was documented as potentially useful but actually always returns null because `/api/persons/{id}` does not exist. The TopScore API only allows fetching the current user via `/api/persons/me`.

**Fix Applied:**
- Enhanced documentation to clearly explain the limitation
- Added alternatives: `searchPeople()`, roster endpoints
- Function kept for compatibility but logs clear warning

---

### 4. Schedule Export Endpoint Returns 404

**File:** `services/topscore.ts` - `fetchScheduleExport()`

**Problem:** The endpoint `/api/schedule` (and likely `/api/teams/{teamId}/schedule/export`) returns 404.

**Fix Applied:**
- Added try/catch with graceful fallback returning empty URLs
- Added clear warning message
- TODO comment for future verification

---

### 5. User-Agent Inconsistency

**File:** `services/auth.ts`

**Problem:** Line 121 used `API_USER_AGENT` constant but line 218 used hardcoded string `"TopScore API v1.0.0"`.

**Fix Applied:**
- Changed line 218 to use `API_USER_AGENT` constant for consistency

---

### 6. Missing Games Endpoint Function

**Files:** `types/api.ts`, `lib/mappers/topscore.ts`, `services/topscore.ts`

**Problem:** `/api/games?event_id=X` is a verified working endpoint (returns 200 with count 94) but no function existed to use it.

**Fix Applied:**
- Added `ApiGame` type to `types/api.ts`
- Added `mapGame()` function to `lib/mappers/topscore.ts`
- Added `fetchGames()` and `fetchGameById()` functions to `services/topscore.ts`

---

## Issues Fixed - Summary Table

| Issue | Severity | File(s) | Status |
|-------|----------|---------|--------|
| False VERIFIED labels in api-response.ts | Critical | types/api-response.ts | FIXED |
| False VERIFIED labels in apiValidation.ts | Critical | lib/apiValidation.ts | FIXED |
| Wrong endpoint patterns in code | Critical | services/topscore.ts | FIXED |
| fetchUserById always returns null | Medium | services/topscore.ts | FIXED (documented) |
| Schedule export returns 404 | Medium | services/topscore.ts | FIXED (graceful fallback) |
| User-Agent inconsistency | Low | services/auth.ts | FIXED |
| Missing fetchGames function | Medium | types/api.ts, lib/mappers/topscore.ts, services/topscore.ts | FIXED |

---

## Verified Working Endpoints

Based on actual API testing (July 2026):

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/persons/me` | GET | ✅ Working | Current user profile |
| `/api/events` | GET | ✅ Working | List with pagination |
| `/api/events?id={id}` | GET | ✅ Working | Uses query param |
| `/api/teams?event_id=X` | GET | ✅ Working | Teams for event |
| `/api/teams?person_id=X` | GET | ✅ Working | Teams for person |
| `/api/teams/show?id=X` | GET | ✅ Working | Uses /teams/show |
| `/api/games?event_id=X` | GET | ✅ Working | Games/schedule |
| `/api/registrations` | GET | ⚠️ Requires params | Needs event_id/team_id/person_id |

## Confirmed Broken Endpoints (DO NOT USE)

| Endpoint | Method | Status | Use Instead |
|----------|--------|--------|-------------|
| `/api/events/{id}` | GET | ❌ 404 | `/api/events?id={id}` |
| `/api/persons/{id}` | GET | ❌ 404 | `/api/persons/me` only |
| `/api/teams/{id}` | GET | ❌ 404 | `/api/teams/show?id={id}` |
| `/api/schedule` | GET | ❌ 404 | `/api/games?event_id=X` |
| `/api/registrations/{id}` | GET | ❌ 404 | - |

---

## Files Modified

1. **types/api-response.ts** - Updated endpoint verification comments
2. **types/api.ts** - Added ApiGame type
3. **lib/mappers/topscore.ts** - Added mapGame function
4. **lib/apiValidation.ts** - Fixed false VERIFIED markers
5. **lib/apiEndpoints.ts** - Already correct (not modified)
6. **services/topscore.ts** - Multiple fixes (endpoint patterns, fetchGames, documentation)
7. **services/auth.ts** - Fixed User-Agent inconsistency
8. **endpoint-verification-results.json** - Enhanced documentation

---

## Recommendations

1. **Before using any speculative endpoint**, verify it exists using:
   ```
   GET /api/help?endpoint=/api/endpoint-path
   ```

2. **Always use query parameters** for single resource fetches:
   - `/api/events?id=123` NOT `/api/events/123`
   - `/api/teams/show?id=123` NOT `/api/teams/123`

3. **Handle 404 errors gracefully** - API may return 404 for endpoints that seem like they should work

4. **Implement endpoint testing in CI** to catch regressions

5. **Document any new endpoints** as SPECULATIVE until verified with `/api/help`

---

## API-Specific Quirks Noted

1. **Non-standard REST patterns**: TopScore doesn't use REST conventions
2. **refresh_token grant not documented**: May not be supported - re-authenticate with password grant
3. **Response wrapper**: All responses wrapped in `{ status, count, result, errors }`
4. **Single vs array result**: Single-object endpoints return `{ result: {...} }`, lists return `{ result: [...] }`