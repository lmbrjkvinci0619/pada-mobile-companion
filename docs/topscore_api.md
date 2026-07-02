# TopScore API Documentation & Developer Guide

**For use with pada.org**  
Version 1.0 | July 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Base URL & Transport](#2-base-url--transport)
3. [Authentication](#3-authentication)
4. [API Request Conventions](#4-api-request-conventions)
5. [API Response Format](#5-api-response-format)
6. [Pagination](#6-pagination)
7. [Embedding Related Data (Fields Parameter)](#7-embedding-related-data-fields-parameter)
8. [Self-Documentation Endpoint](#8-self-documentation-endpoint)
9. [Error Handling](#9-error-handling)
10. [Common API Workflows](#10-common-api-workflows)
11. [Code Examples](#11-code-examples)
12. [TopScore Concepts for Pada.org Developers](#12-topscore-concepts-for-padaorg-developers)
13. [Permission Levels](#13-permission-levels)
14. [Best Practices & Security](#14-best-practices--security)
15. [Testing & Debugging](#15-testing--debugging)

---

## 1. Overview

The TopScore API (formerly Ultimate Central) is a RESTful JSON API that allows programmatic access to organization data managed in the TopScore platform. It supports two authentication modes: **Basic Authentication** (limited data access) and **OAuth2** (full data access).

The API is self-documenting: every endpoint describes itself via the `/api/help` endpoint.

### Scope Note for PadaHub

The PadaHub mobile companion application uses the TopScore API primarily in **read-only** mode — fetching events, teams, schedules, registrations, and person profiles. The only `POST` operation used by PadaHub is **live score reporting** (captains only). Full API write access (creating events, editing schedules, sending messages, issuing refunds) exists on the platform but is not used by the mobile app; those functions remain on the website.

### Key Characteristics

- Accepts `GET` and `POST` requests, returns JSON
- `GET` requests retrieve information (public data by default)
- `POST` requests make changes — e.g., create new events, edit schedules, send messages (always require authentication)
- All requests must be made over SSL
- Two authentication schemes: Basic Auth (api_csrf signing) and OAuth2 (Bearer tokens)

### Base Domain for Pada.org

Since most organizations do not have SSL certificates on their custom domains, API requests must use the TopScore platform domain protected by their SSL certificate:

- **API Domain:** `pada.usetopscore.com`
- **Auth Key URL:** `pada.org/u/auth-key` (shows your Client ID and Client Secret for Basic Auth)
- **OAuth Key URL:** `pada.org/u/oauth-key` (shows your OAuth client_id and client_secret)

---

## 2. Base URL & Transport

### Base URL

```
https://pada.usetopscore.com/api/
```

All endpoints are relative to this base URL. In some client configurations (e.g., the PadaHub mobile app), the base URL may be set to `https://pada.usetopscore.com` without the `/api` suffix, and the client appends `/api` to each request path automatically. Verify your setup against your environment configuration.

### SSL Requirement

All API requests **must** be made over HTTPS. Requests over HTTP will fail. Since pada.org does not have its own SSL certificate, all API traffic routes through `pada.usetopscore.com`.

### User Agent

Include a descriptive `User-Agent` header to pass TopScore's bot filters. The platform recommends:

```
User-Agent: TopScore API v1.0.0
```

For PadaHub-specific request tracking, you may use a custom identifier:

```
User-Agent: Pada.org Mobile App/1.0
```

---

## 3. Authentication

TopScore offers two authentication schemes with different security levels and data access.

### 3.1 Basic Authentication

Basic Authentication uses a `client_id` (auth token) and a signed `api_csrf` signature. It is limited in what data it can access.

#### Obtaining Credentials

1. Go to `pada.org/u/auth-key`
2. Note your **Client ID** and **Client Secret**

#### auth_token Parameter

Your Client ID is passed as a query parameter:

```
GET /api/endpoint?auth_token=CLIENT_ID
```

#### api_csrf Signature (Required for POST Requests)

All `POST` requests must be signed with your Client Secret. The signature is computed as follows:

**Step 1:** Gather three values:
- `CLIENT_ID` — your Client ID
- `nonce` — a random string of at least 10 characters
- `timestamp` — current Unix timestamp in seconds (since epoch)

**Step 2:** Compute the HMAC-SHA256 hash, base64url-encoded, using your Client Secret as the key:

```
hmac = base64url_encode(hmac_sha256(CLIENT_ID + nonce + timestamp, CLIENT_SECRET))
```

**Step 3:** Create the final signature:

```
SIGNATURE = base64url_encode(nonce + '|' + timestamp + '|' + hmac)
```

**Step 4:** Pass the signature:

```
POST /api/endpoint?auth_token=CLIENT_ID&api_csrf=SIGNATURE
```

#### Signature Validity

A signature is valid for **1 hour** after creation. After that, it expires and a new signature must be generated.

#### Authentication Test

Test your credentials with the `/api/me` endpoint:

```
GET /api/me?auth_token=CLIENT_ID&api_csrf=SIGNATURE
```

**Response (200 OK):**

```json
{
  "status": 200,
  "count": 1,
  "result": [
    {
      "person_id": 12345,
      "api_csrf_valid": true
    }
  ],
  "errors": []
}
```

- **200 OK** — valid credentials; response includes `person_id` and `api_csrf_valid: true`
- **401 Unauthorized** — `auth_token` is missing or invalid
- **419 Unprocessable Entity** — `auth_token` valid but `api_csrf` is invalid or expired

> **Note:** `GET` requests only validate `auth_token`; `api_csrf` is ignored. Only `POST` requests require both.

### 3.2 OAuth2 Authentication

OAuth2 provides higher security and enables access to more data. Use this for production applications.

#### Obtaining OAuth Credentials

1. Go to `pada.org/u/oauth-key`
2. Note your `client_id` and `client_secret`

#### Step 1: Generate an Access Token (Server Credentials Grant)

Use your OAuth client credentials to obtain an access token:

```bash
curl "https://pada.usetopscore.com/api/oauth/server" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**Response:**

```json
{
  "status": 200,
  "count": 1,
  "result": [
    {
      "access_token": "...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  ],
  "errors": []
}
```

`token_type` is always `"Bearer"` and `expires_in` indicates seconds until token expiry.

#### Step 2: Login as a User (Password Grant)

To act on behalf of a specific user, POST their credentials along with your OAuth client credentials:

```bash
curl "https://pada.usetopscore.com/api/oauth/server" \
  -d "grant_type=password" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=user@pada.org" \
  -d "password=USER_PASSWORD"
```

> **Note:** The `username` and `password` here are the **end user's** TopScore account credentials (the person logging in), not your OAuth client credentials. This grant should only be used server-side — never embed this flow in client-side code.

**Response:**

```json
{
  "status": 200,
  "count": 1,
  "result": [
    {
      "access_token": "...",
      "token_type": "Bearer",
      "expires_in": 3600
    }
  ],
  "errors": []
}
```

#### Step 3: Use the Access Token

Pass the access token in the `Authorization` header on all subsequent requests:

```bash
curl "https://pada.usetopscore.com/api/persons/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

The access token expires after the `expires_in` value returned in the token response (re-request a new token before it expires).

---

## 4. API Request Conventions

### HTTP Methods

| Method | Purpose | Auth Required |
|--------|---------|---------------|
| `GET` | Retrieve data (list or single record) | Optional (data limited without auth) |
| `POST` | Create or modify data | Always required |

> **Note:** The TopScore API only supports `GET` and `POST` methods. There are no `PUT`, `PATCH`, or `DELETE` endpoints. All modifications (edits, updates, deletions) are performed via `POST`.

### Query Parameters for GET Requests

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | `1` | — | Page number |
| `per_page` | `10` | `100` | Results per page |

### Example GET Request with Pagination

```
GET https://pada.usetopscore.com/api/events?page=2&per_page=50&auth_token=CLIENT_ID
```

### URL Encoding

All query parameter values must be URL-encoded. Spaces become `%20`, special characters are encoded accordingly.

---

## 5. API Response Format

Every API response is a JSON object with a consistent structure.

### Response Schema

```json
{
  "status": 200,
  "count": 42,
  "result": [ ... ],
  "errors": []
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | integer | HTTP status code (matches the actual HTTP response). `2xx` = success, `4xx` = client error, `5xx` = server error |
| `count` | integer | Total number of results matching the query. May differ from `result.length` due to pagination |
| `result` | array | Array of result objects. Empty if an error occurred |
| `errors` | array | Array of error objects. Each error has `message`, `field`, and `data` |

### Error Object Schema

```json
{
  "message": "Human-readable error description",
  "field": "api_field_name",
  "data": { ... }
}
```

- `message` — always present, describes the error
- `field` — the API field related to the error, or `null` if the error is general
- `data` — additional error context, or `null`

---

## 6. Pagination

All `GET` responses are paginated.

### Parameters

| Parameter | Default | Maximum | Description |
|-----------|---------|---------|-------------|
| `page` | `1` | — | Page number to retrieve |
| `per_page` | `10` | `100` | Number of results per page |

### Example

```
GET /api/events?page=3&per_page=25
```

### Understanding Count vs Result Length

`count` reflects the **total** number of matching records across all pages. `result.length` reflects the number of records on the current page. Always use `count` to determine if more pages exist:

```python
total_pages = ceil(count / per_page)
```

---

## 7. Embedding Related Data (Fields Parameter)

By default, responses return data only for the primary model requested. Use the `fields` parameter to embed related data.

### Simple Fields (Array Format)

Request additional related models as an array of model names:

```
GET /api/registrations?fields[]=Person&fields[]=Team
```

### Nested Fields (Associative Array Format)

Request deeply nested relations using an associative array:

```
GET /api/registrations?fields[]=Person&fields[]=Team&fields[Event]=Location&fields[Purchase]=Transaction
```

### Example

To list registrations including the person, team, event location, and purchase transaction details:

```
fields[]=Person&fields[]=Team&fields[Event]=Location&fields[Purchase][]=Transaction&fields[Purchase][]=Product
```

### What Fields Are Available

Use the `/api/help` endpoint to see what fields and relations are available for each endpoint.

---

## 8. Self-Documentation Endpoint

Every endpoint is self-documenting. Use the help endpoint to explore.

### Full Documentation

```
GET /api/help
```

Returns documentation for all available endpoints. Authentication may be required to access full endpoint listings.

### Single Endpoint Documentation

```
GET /api/help?endpoint=/api/events
```

Returns documentation for a specific endpoint, including accepted parameters and field requirements.

### Documentation Response Example

```json
{
  "status": 200,
  "count": 1,
  "result": [
    {
      "endpoint": "/api/events",
      "method": "GET",
      "description": "List events",
      "parameters": {
        "page": { "type": "integer", "default": 1 },
        "per_page": { "type": "integer", "default": 10, "max": 100 },
        "fields": { "type": "array", "description": "Related models to include" }
      },
      "fields": {
        "id": { "type": "integer", "description": "Event ID" },
        "name": { "type": "string", "description": "Event name" },
        "start_date": { "type": "datetime", "description": "Event start date" }
      }
    }
  ],
  "errors": []
}
```

**Always use `/api/help` as your primary reference when building against the API.** Endpoint capabilities change over time; the self-doc endpoint always reflects the current state.

---

## 9. Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request — malformed request syntax |
| `401` | Unauthorized — missing or invalid auth token |
| `403` | Forbidden — authenticated but lacks permission |
| `404` | Not Found — resource does not exist |
| `419` | Unprocessable Entity — auth token valid but CSRF signature invalid or expired (Basic Auth only) |
| `422` | Unprocessable Entity — validation errors |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error — TopScore server error |

### Handling Errors in Code

```python
import requests

def api_get(endpoint, **kwargs):
    response = requests.get(
        f"https://pada.usetopscore.com/api{endpoint}",
        headers={"User-Agent": "Pada.org App/1.0"},
        **kwargs
    )
    data = response.json()

    if data["status"] >= 400:
        for error in data["errors"]:
            print(f"Error: {error['message']} (field: {error['field']})")
        return None

    return data["result"]

# Usage
events = api_get("/events", params={"auth_token": CLIENT_ID})
```

### Rate Limiting

TopScore may impose rate limits on API requests. If you receive a `429` response:

- Wait before retrying (exponential backoff recommended)
- Cache responses where possible to reduce request volume
- Contact TopScore support if rate limits are consistently problematic

---

## 10. Common API Workflows

### Workflow 1: List Events

```bash
# Basic (unauthenticated — limited public data)
curl "https://pada.usetopscore.com/api/events"

# With auth (more data)
curl "https://pada.usetopscore.com/api/events?auth_token=CLIENT_ID"

# OAuth2
curl "https://pada.usetopscore.com/api/events" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Workflow 2: Get Event Details with Related Data

```bash
curl "https://pada.usetopscore.com/api/events/EVENT_ID?auth_token=CLIENT_ID&fields[]=Location&fields[]=Division"
```

### Workflow 3: List Registrations for an Event

```bash
curl "https://pada.usetopscore.com/api/registrations?event_id=EVENT_ID&auth_token=CLIENT_ID&fields[]=Person&fields[]=Team"
```

### Workflow 4: Create a Registration (POST)

> **Note:** PadaHub does not use this workflow. The mobile app is read-only; registration is done through the website. This workflow is documented for completeness.

```bash
# First, ensure signature is valid for 1 hour
curl -X POST "https://pada.usetopscore.com/api/registrations" \
  -d "event_id=EVENT_ID" \
  -d "person_id=PERSON_ID" \
  -d "auth_token=CLIENT_ID" \
  -d "api_csrf=SIGNATURE"
```

### Workflow 5: Get Person Profile

```bash
curl "https://pada.usetopscore.com/api/persons/PERSON_ID?auth_token=CLIENT_ID&fields[]=Teams&fields[]=Registrations"
```

### Workflow 6: List Teams

```bash
curl "https://pada.usetopscore.com/api/teams?auth_token=CLIENT_ID&fields[]=Roster&fields[]=Event"
```

### Workflow 7: Get Schedule/Game Results

```bash
curl "https://pada.usetopscore.com/api/schedule?event_id=EVENT_ID&auth_token=CLIENT_ID"
```

### Workflow 8: User Login Flow (OAuth2)

```python
import requests

def oauth_login(email, password, client_id, client_secret):
    response = requests.post(
        "https://pada.usetopscore.com/api/oauth/server",
        data={
            "grant_type": "password",
            "client_id": client_id,
            "client_secret": client_secret,
            "username": email,
            "password": password
        }
    )
    data = response.json()
    return data["result"][0]["access_token"]
```

---

## 11. Code Examples

### 11.1 Python — Basic Auth GET

```python
import requests
import time
import hmac
import hashlib
import base64
import random
import string
import json

BASE_URL = "https://pada.usetopscore.com/api"
CLIENT_ID = "your_client_id"
CLIENT_SECRET = "your_client_secret"

def generate_csrf_signature(client_id, client_secret):
    nonce = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
    timestamp = int(time.time())
    message = client_id + nonce + str(timestamp)
    signature = base64.urlsafe_b64encode(
        hmac.new(
            client_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
    ).decode()
    inner = f"{nonce}|{timestamp}|{signature.decode()}"
    return base64.urlsafe_b64encode(inner.encode()).decode()

def api_get(endpoint, params=None):
    params = params or {}
    params["auth_token"] = CLIENT_ID
    resp = requests.get(f"{BASE_URL}{endpoint}", params=params,
                        headers={"User-Agent": "Pada.org App/1.0"})
    return resp.json()

def api_post(endpoint, data=None):
    data = data or {}
    data["auth_token"] = CLIENT_ID
    data["api_csrf"] = generate_csrf_signature(CLIENT_ID, CLIENT_SECRET)
    resp = requests.post(f"{BASE_URL}{endpoint}", data=data,
                         headers={"User-Agent": "Pada.org App/1.0"})
    return resp.json()

# List events
events = api_get("/events", {"per_page": 20})
for event in events["result"]:
    print(event["name"], event.get("start_date"))
```

### 11.2 Python — OAuth2

```python
import requests

BASE_URL = "https://pada.usetopscore.com/api"
CLIENT_ID = "your_oauth_client_id"
CLIENT_SECRET = "your_oauth_client_secret"

def get_access_token():
    resp = requests.post(
        f"{BASE_URL}/oauth/server",
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }
    )
    return resp.json()["result"][0]["access_token"]

def api_oauth_get(endpoint, token, params=None):
    resp = requests.get(
        f"{BASE_URL}{endpoint}",
        params=params,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "Pada.org App/1.0"
        }
    )
    return resp.json()

# Get current user
token = get_access_token()
me = api_oauth_get("/persons/me", token)
print(me["result"][0]["person_id"])
```

### 11.3 JavaScript/Node.js — OAuth2

```javascript
const BASE_URL = 'https://pada.usetopscore.com/api';
const CLIENT_ID = 'your_oauth_client_id';
const CLIENT_SECRET = 'your_oauth_client_secret';

async function getAccessToken() {
  const resp = await fetch(`${BASE_URL}/oauth/server`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
  const data = await resp.json();
  return data.result[0].access_token;
}

async function apiGet(endpoint, token, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Pada.org App/1.0'
    }
  });
  return resp.json();
}

// Usage
const token = await getAccessToken();
const events = await apiGet('/events', token, { per_page: 20 });
console.log(events.result);
```

### 11.4 cURL Examples

**List events (Basic Auth):**

```bash
curl "https://pada.usetopscore.com/api/events?auth_token=CLIENT_ID&per_page=10"
```

**Get event details (Basic Auth + fields):**

```bash
curl "https://pada.usetopscore.com/api/events/EVENT_ID?auth_token=CLIENT_ID&fields[]=Location"
```

**Create a registration (Basic Auth + POST):**

```bash
curl -X POST "https://pada.usetopscore.com/api/registrations" \
  -d "event_id=123" \
  -d "person_id=456" \
  -d "auth_token=CLIENT_ID" \
  -d "api_csrf=SIGNATURE"
```

**List events (OAuth2):**

```bash
curl "https://pada.usetopscore.com/api/events" -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## 12. TopScore Concepts for Pada.org Developers

Understanding these TopScore platform concepts is essential for working with the API effectively.

### 12.1 Organizations & Sites

TopScore supports multiple sites under a single organization. Pada.org is one site. If Pada expands to sub-organizations (e.g., regional chapters), each may be a separate site with its own API credentials.

### 12.2 Persons (User Accounts)

Every user — players, coaches, parents, administrators — is a **Person** record. Persons have:
- Profile information (name, email, phone, date of birth, gender)
- Account credentials (email/password)
- Family links (for youth accounts managed by parents)
- Privacy settings (youth accounts have restricted public visibility)

### 12.3 Teams & Rosters

- **Active Roster** — players currently participating in running events
- **Standing Roster** — the official, persistent roster for a team across events
- **Event-Only Teams** — temporary teams created for a specific event, not intended for recurring participation

Team member roles include: Player, Captain, Coach, Assistant Coach, Admin, Chaperone, Volunteer, Staff.

### 12.4 Events

Events are the core organizing entity. An event can be:
- A tournament
- A season/league
- A camp or clinic
- A tryout

Events have:
- Registration periods (open/close dates)
- Divisions (age/gender groupings, e.g., "U20 Open", "Women's")
- Groups (internal team groupings for scheduling)
- Locations and schedule blocks
- Registration products and pricing tiers

### 12.5 Registrations

A **Registration** links a Person to an Event. It captures:
- Which event and division
- Which team (if any)
- Payment status
- Waiver status
- Registration status (started, complete, cancelled, etc.)

### 12.6 Schedules & Game Results

TopScore manages:
- Schedule blocks (time slots on fields/courts)
- Games/matches with team matchups
- Scores reported by Score Reporters or Coordinators
- Standings and rankings (using TrueSkill rating system)
- MVP voting (if enabled for the event)

### 12.7 Products & Commerce

TopScore has an e-commerce layer:
- **Memberships** — recurring products with tiered access
- **Event Registration Products** — priced by division, early bird discounts
- **Store Products** — merchandise, tickets, etc.
- Payment methods: credit card (online), cash, check
- Refunds handled by Trusted Admins

### 12.8 Waivers

Digital waivers are attached to events and products. A registration is not complete until the waiver is signed. Signed waivers are legally binding.

### 12.9 Mailing Lists

Organizations can create mailing lists for targeted communication. API access may allow reading/subscribing to mailing lists.

### 12.10 Family Accounts

Family accounts link adult and youth accounts. Adults can:
- Register youth for events
- Pay on their behalf
- Sign waivers for them
- Manage their profiles

This is important for pada.org's youth ultimate programs.

---

## 13. Permission Levels

TopScore has a layered permissions model. When accessing the API:

| Permission Level | API Access |
|-----------------|------------|
| **Account Holder** | Basic read of public data; cannot modify |
| **Editor** | Edit site content; cannot manage events unless coordinator |
| **Score Reporter** | Report game results |
| **Coordinator** | Full event management; cannot edit financial transactions |
| **Lite Admin** | Broad site access; cannot edit financials or issue refunds |
| **Admin** | Full access except financial settings |
| **Trusted Admin** | Complete access including financials, refunds, settings |

For API access:
- **Basic Auth** works for any logged-in user, but data visibility is limited
- **OAuth2 with Trusted Admin credentials** provides the most complete API access
- Only Trusted Admins can access financial endpoints and issue refunds via API

Organization-level permissions (Admin/Trusted Admin) can be assigned across all sites in an organization via **Admin > Settings > Organization**.

---

## 14. Best Practices & Security

### General

1. **Always use HTTPS** — never make API requests over plain HTTP
2. **Use OAuth2 for production** — Basic Auth is limited and less secure
3. **Protect your Client Secret / OAuth credentials** — treat them like passwords
4. **Rotate credentials** if you suspect compromise
5. **Never embed secrets in client-side JavaScript** — only server-side code should hold secrets
6. **Store credentials in environment variables** — never hardcode

### Request Design

7. **Use the `fields` parameter** to fetch only what you need — reduces payload size
8. **Implement pagination correctly** — use `count` to calculate total pages, not `result.length`
9. **Cache responses** where data doesn't change frequently (events, schedules)
10. **Respect rate limits** — implement exponential backoff on `429` responses

### Signature & Token Management

11. **Regenerate CSRF signatures** for each POST request; they expire after 1 hour
12. **Track access token expiry** — re-request before making authenticated calls with an expired token
13. **Use a nonce of at least 10 random characters** for CSRF signatures

### Error Handling

14. **Always check `data["status"]`** before processing `data["result"]`
15. **Log errors** with the full error object including `message`, `field`, and `data`
16. **Distinguish between 401/419** — 401 means bad token, 419 means expired signature

---

## 15. Testing & Debugging

### Discovering Available Endpoints

The API is self-documenting. Always start by exploring:

```bash
# Get all endpoints and documentation
curl "https://pada.usetopscore.com/api/help?auth_token=CLIENT_ID"

# Get documentation for a specific endpoint
curl "https://pada.usetopscore.com/api/help?endpoint=/api/events&auth_token=CLIENT_ID"
```

### Testing Authentication

**Basic Auth:**

```bash
curl "https://pada.usetopscore.com/api/me?auth_token=CLIENT_ID&api_csrf=SIGNATURE"
```

- 200 + `api_csrf_valid: true` → authentication is working

**OAuth2:**

```bash
curl "https://pada.usetopscore.com/api/persons/me \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

- 200 → token is valid

### Test Your Signature Generation

Use a minimal signature first to confirm the algorithm:

```python
import hmac, hashlib, base64, time, random, string

def make_signature(client_id, client_secret):
    nonce = ''.join(random.choices(string.ascii_letters, k=20))
    ts = int(time.time())
    msg = client_id + nonce + str(ts)
    h = base64.urlsafe_b64encode(hmac.new(
        client_secret.encode(), msg.encode(), hashlib.sha256
    ).digest()).decode()
    inner = f"{nonce}|{ts}|{h}"
    return base64.urlsafe_b64encode(inner.encode()).decode()

sig = make_signature("my_client_id", "my_client_secret")
print(f"Signature: {sig}")
print(f"Timestamp used: {int(time.time())}")
```

### Local Dev with Postman / Insomnia

Import the OpenAPI spec (if available) or manually configure:
- Base URL: `https://pada.usetopscore.com/api`
- Auth: Bearer token or query parameters as described above
- Response wrapper: check `status`, read from `result`

---

## Appendix A: Quick Reference

### Base URL

```
https://pada.usetopscore.com/api/
```

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/me` | GET | Test auth, get current user ID |
| `/api/oauth/server` | POST | Generate OAuth2 access token |
| `/api/help` | GET | Full API documentation |
| `/api/help?endpoint=X` | GET | Docs for specific endpoint |
| `/api/events` | GET | List events |
| `/api/events/{id}` | GET | Event details |
| `/api/persons` | GET | List persons |
| `/api/persons/{id}` | GET | Person profile |
| `/api/persons/me` | GET | Current authenticated user |
| `/api/registrations` | GET/POST | List or create registrations |
| `/api/teams` | GET | List teams |
| `/api/schedule` | GET | Event schedule |

### Response Wrapper

```json
{
  "status": 200,
  "count": 0,
  "result": [],
  "errors": []
}
```

### Pagination Defaults

- `page`: 1
- `per_page`: 10
- `per_page` max: 100

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **TopScore** | The platform (formerly Ultimate Central) used by pada.org for event management, registration, scheduling, and member management |
| **api_csrf** | A signed request signature using HMAC-SHA256 for Basic Auth POST requests |
| **auth_token** | A user's Client ID, used to identify the caller in Basic Auth |
| **access_token** | The OAuth2 Bearer token returned by `/api/oauth/server`; used to authenticate requests via the `Authorization: Bearer` header |
| **oauth_token** | Informal name for the OAuth2 `access_token` (used in some parts of this spec) |
| **TrueSkill** | Microsoft's rating system used by TopScore to rank teams/players |
| **Registration** | A record linking a Person to an Event |
| **Standing Roster** | A team's persistent official roster across events |
| **Active Roster** | A team's roster for currently running events |
| **Event-Only Team** | A temporary team created for a specific event |
| **Trusted Admin** | The highest permission level in TopScore; can access all features including financials |

---

## Appendix C: Useful URLs for Pada.org

| Purpose | URL |
|---------|-----|
| TopScore Platform | https://pada.usetopscore.com |
| Basic Auth Credentials | https://pada.org/u/auth-key |
| OAuth2 Credentials | https://pada.org/u/oauth-key |
| API Self-Documentation | https://pada.usetopscore.com/api/help |
| TopScore Support | https://help.ultimatecentral.com/support/home |
| Privacy Policy | https://usetopscore.com/privacy-policy |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | July 2026 | Initial documentation for pada.org integration |