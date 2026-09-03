#!/usr/bin/env node
/**
 * TopScore API Endpoint Verification Script
 *
 * Verifies which endpoints actually exist on the TopScore API
 * by checking /api/help and testing specific endpoints.
 *
 * Credentials are read from the environment to avoid leaking secrets:
 *   TOPSCORE_BASE_URL   default: https://pada.usetopscore.com/api
 *   TOPSCORE_CLIENT_ID  required for client_credentials grant
 *   TOPSCORE_CLIENT_SECRET required for client_credentials grant
 */

const BASE_URL = process.env.TOPSCORE_BASE_URL || "https://pada.usetopscore.com/api";
const CLIENT_ID = process.env.TOPSCORE_CLIENT_ID;
const CLIENT_SECRET = process.env.TOPSCORE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing TOPSCORE_CLIENT_ID / TOPSCORE_CLIENT_SECRET environment variables. " +
    "Set them in your shell or .env before running this script."
  );
  process.exit(1);
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`${BASE_URL}/oauth/server`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TopScore API v1.0.0",
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.access_token) {
    return data.access_token;
  }
  throw new Error("Failed to get access token: " + JSON.stringify(data));
}

async function getAllEndpoints(token) {
  const res = await fetch(`${BASE_URL}/help`, {
    headers: { "Authorization": `Bearer ${token}`, "User-Agent": "TopScore API v1.0.0" },
  });
  const data = await res.json();
  return data.result || [];
}

async function getEndpointHelp(token, endpoint) {
  const res = await fetch(`${BASE_URL}/help?endpoint=${encodeURIComponent(endpoint)}`, {
    headers: { "Authorization": `Bearer ${token}`, "User-Agent": "TopScore API v1.0.0" },
  });
  return res.json();
}

async function testEndpoint(token, method, path) {
  const hasQuery = path.includes("?");
  const testPath = path.replace(/\/1\//g, "/999999/"); // Use unlikely ID
  const url = `${BASE_URL}${testPath}${hasQuery ? "&" : "?"}auth_token=${CLIENT_ID}`;
  
  const res = await fetch(url, {
    method: method,
    headers: { "Authorization": `Bearer ${token}`, "User-Agent": "TopScore API v1.0.0" },
  });
  
  return { status: res.status, ok: res.ok };
}

async function main() {
  console.log("TopScore API Endpoint Verification");
  console.log("=".repeat(60));
  
  let token;
  try {
    token = await getAccessToken();
    console.log("Got access token\n");
  } catch (error) {
    console.error("Failed to get access token:", error.message);
    process.exit(1);
  }

  // Get all documented endpoints
  console.log("Fetching all endpoints from /api/help...");
  const allEndpoints = await getAllEndpoints(token);
  console.log(`Found ${allEndpoints.length} documented endpoints\n`);

  // Parse endpoints from help response
  const documented = [];
  for (const item of allEndpoints) {
    if (item.endpoint) {
      const methods = item.method.split(",").map(m => m.trim());
      for (const method of methods) {
        if (method !== "OPTIONS") {
          documented.push({
            path: item.endpoint,
            method: method,
            help_url: item.help_url
          });
        }
      }
    }
  }

  console.log("=".repeat(60));
  console.log("\nDOCUMENTED ENDPOINTS:\n");
  
  // Group by path
  const byPath = {};
  for (const ep of documented) {
    if (!byPath[ep.path]) byPath[ep.path] = [];
    byPath[ep.path].push(ep.method);
  }
  
  for (const [path, methods] of Object.entries(byPath)) {
    console.log(`  ${methods.join(", ").padEnd(10)} ${path}`);
  }

  // Now check speculative endpoints
  const SPECULATIVE = [
    { path: "/api/family", method: "GET" },
    { path: "/api/family/invite", method: "POST" },
    { path: "/api/memberships", method: "GET" },
    { path: "/api/memberships/purchase", method: "POST" },
    { path: "/api/events/{id}/attendance", method: "GET" },
    { path: "/api/events/{id}/attendance", method: "POST" },
    { path: "/api/events/{id}/bracket", method: "GET" },
    { path: "/api/events/{id}/standings", method: "GET" },
    { path: "/api/events/{id}/pools/{name}/standings", method: "GET" },
    { path: "/api/teams/{id}/standings", method: "GET" },
    { path: "/api/waivers", method: "GET" },
    { path: "/api/waivers/{id}/sign", method: "POST" },
    { path: "/api/events/{id}/waivers", method: "GET" },
    { path: "/api/polls", method: "GET" },
    { path: "/api/polls", method: "POST" },
    { path: "/api/polls/{id}", method: "GET" },
    { path: "/api/polls/{id}/vote", method: "POST" },
    { path: "/api/notifications", method: "GET" },
    { path: "/api/notifications/read-all", method: "POST" },
    { path: "/api/mail", method: "GET" },
    { path: "/api/mail/send", method: "POST" },
    { path: "/api/teams/{id}/practices", method: "GET" },
    { path: "/api/teams/{id}/practices", method: "POST" },
    { path: "/api/practices/{id}", method: "GET" },
    { path: "/api/practices/{id}", method: "POST" },
    { path: "/api/practices/{id}/attendance", method: "POST" },
    { path: "/api/teams/{id}/roster", method: "GET" },
    { path: "/api/teams/{id}/roster/{person_id}", method: "POST" },
    { path: "/api/teams/{id}/roster/invite", method: "POST" },
    { path: "/api/teams/{id}/roster/invitations", method: "GET" },
    { path: "/api/teams/{id}/roster/invitations/{id}", method: "POST" },
    { path: "/api/teams/{id}/stats", method: "GET" },
    { path: "/api/teams/{id}/attendance", method: "GET" },
    { path: "/api/articles", method: "GET" },
    { path: "/api/articles/{slug}", method: "GET" },
    { path: "/api/locations", method: "GET" },
    { path: "/api/locations", method: "POST" },
    { path: "/api/roster-invitations/{id}/respond", method: "POST" },
    { path: "/api/events/{id}/roster", method: "GET" },
    { path: "/api/events/{id}/roster/settings", method: "GET" },
    { path: "/api/events/{id}/attendance/survey", method: "GET" },
    { path: "/api/events/{id}/attendance/survey", method: "POST" },
    { path: "/api/persons/search", method: "GET" },
    { path: "/api/teams/search", method: "GET" },
    { path: "/api/registrations/{id}", method: "GET" },
    { path: "/api/registrations/{id}", method: "POST" },
    { path: "/api/teams/{id}/schedule/export", method: "GET" },
    { path: "/api/teams/{id}/schedule/url", method: "GET" },
    { path: "/api/persons/{id}/registrations", method: "GET" },
    { path: "/api/teams/{id}/registrations", method: "GET" },
    { path: "/api/events/{id}/registrations", method: "GET" },
    { path: "/api/persons/{id}", method: "POST" },
  ];

  // Normalize paths for comparison
  const docPaths = new Set(documented.map(e => `${e.method}:${e.path}`));

  // Check if speculative is documented
  const verified = [];
  const notDocumented = [];
  const exists = [];
  const notFound = [];

  for (const spec of SPECULATIVE) {
    const normalizedPath = spec.path.replace(/\{id\}/g, "1").replace(/\{name\}/g, "test");
    const key = `${spec.method}:${spec.path}`;
    const normKey = `${spec.method}:${normalizedPath}`;
    
    if (docPaths.has(key) || docPaths.has(normKey)) {
      verified.push({ ...spec, status: "DOCUMENTED" });
    } else {
      notDocumented.push({ ...spec, status: "NOT_IN_HELP" });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\nVERIFIED ENDPOINTS (found in /api/help):\n");
  for (const ep of verified) {
    console.log(`  [OK]   ${ep.method.padEnd(6)} ${ep.path}`);
  }

  console.log("\nNOT DOCUMENTED ENDPOINTS (NOT in /api/help):\n");
  for (const ep of notDocumented) {
    console.log(`  [MISS] ${ep.method.padEnd(6)} ${ep.path}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("\nSUMMARY:\n");
  console.log(`  Documented: ${verified.length}`);
  console.log(`  Not in /api/help: ${notDocumented.length}`);

  // Save results
  const fs = require("fs");
  const results = {
    timestamp: new Date().toISOString(),
    totalEndpoints: documented.length,
    verifiedEndpoints: verified,
    notDocumentedEndpoints: notDocumented,
    allDocumentedEndpoints: documented.map(e => ({ method: e.method, path: e.path })),
  };
  fs.writeFileSync("endpoint-verification-results.json", JSON.stringify(results, null, 2));
  console.log("\nResults saved to endpoint-verification-results.json");
}

main().catch(console.error);