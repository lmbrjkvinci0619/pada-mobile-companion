# Agent Guidelines — PadaHub Mobile Companion

## Project Overview

PadaHub is a React Native (Expo) mobile companion app for pada.org (TopScore platform).
It communicates with the TopScore REST API at `https://pada.usetopscore.com`.

## Key Files

| File | Purpose |
|------|---------|
| `docs/topscore_api.md` | **Source of truth** for TopScore API behavior |
| `lib/apiClient.ts` | HTTP client (GET/POST, auth, response unwrapping) |
| `lib/apiCsrf.ts` | HMAC-SHA256 CSRF signature for Basic Auth POST |
| `lib/endpointCatalog.ts` | Single source of truth for endpoint verification status |
| `lib/urlUtils.ts` | URL construction helpers |
| `services/auth.ts` | OAuth2 login, token storage, refresh |
| `services/topscore.ts` | All TopScore API calls (events, teams, games, etc.) |
| `lib/mappers/topscore.ts` | Raw API response → typed domain models |

## TopScore API Conventions (read `docs/topscore_api.md` first)

- **Only GET and POST** are supported — no PUT/PATCH/DELETE.
- Single-resource lookups use query params: `/api/events?id=X` NOT `/api/events/{id}`.
- Response wrapper: `{ status: number, count: number, result: T|T[], errors: [] }`.
- `auth_token` = Basic Auth client ID (GET requests). `api_csrf` = HMAC-SHA256 signature (POST requests).
- OAuth2 preferred in production (Bearer token in `Authorization` header).
- Signature validity: 1 hour. Nonce: min 10 chars (code uses 16).

## Code Style

- **No comments** unless the code is genuinely unclear or an unusual pattern requires explanation.
- Use TypeScript strict mode. Prefer `unknown` over `any`.
- All API field names from TopScore stay snake_case in mapper types (`ApiPerson`, `ApiEvent`).
- Internal domain models use camelCase (`id`, `firstName`, `startDate`).
- Error messages: user-friendly, never leak internals.
- No `// TODO: remove before shipping` or similar — either fix now or open an issue.

## Adding New API Features

1. Check `lib/endpointCatalog.ts` to see if the endpoint is VERIFIED / DEPRECATED / SPECULATIVE.
2. If SPECULATIVE, prefer not adding it without first testing against `/api/help?endpoint=...`.
3. Add the mapping function in `lib/mappers/topscore.ts` if a new `Api*` type is needed.
4. Add the service function in `services/topscore.ts`.
5. Add a React Query hook in `hooks/useApi.ts`.
6. If adding a new domain model, add it to `types/index.ts`.

## Testing

- Unit tests: Jest. Mock `global.fetch` directly — do not use MSW.
- Test file location: same directory as the module, `*.test.ts` or `*.test.tsx`.
- Cover: response unwrapping, error paths, CSRF signature generation, URL normalization.

## Environment Variables

Prefix: `EXPO_PUBLIC_TOPSCORE_*` for client-visible vars. Never log or expose `TOPSCORE_CLIENT_SECRET` in client code.

## Architecture Notes

- **Auth**: Token stored in `expo-secure-store`. `memoryTokens` for session-only (non-persistent) mode.
- **Cache**: In-memory Map in `apiClient.ts`. Cleared on auth change.
- **Deduplication**: In-flight GET requests share a Promise for the same cache key.
- **Retry**: 5xx → exponential backoff (2 attempts). 429 → honors `Retry-After` header. 401 → token refresh + retry (OAuth2 only). 419 → CSRF regeneration + retry.
- **Abortion**: All API calls accept `AbortSignal`. Cleanup in `finally` block.

## DO NOT

- Do not add `// HACK`, `// FIXME`, or `// BUG` comments — either fix or open an issue.
- Do not commit credentials, tokens, or real API keys.
- Do not use `_method` override for write operations unless absolutely necessary and documented.
- Do not call speculative endpoints from production UI paths without guards.
- Do not change `lib/endpointCatalog.ts` verification statuses without running the verification script (`node scripts/verify-endpoints.js`) against a live TopScore server.