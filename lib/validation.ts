const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INPUT_LENGTH = 10000;
const MAX_EMAIL_LENGTH = 255;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(trimmed);
}

export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/[<>]/g, "")
    .trim();
}

export function sanitizeAnnouncementContent(content: unknown): string {
  if (typeof content !== "string") return "";
  return content
    .slice(0, MAX_INPUT_LENGTH)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/<[^>]*>/g, (match) => {
      const allowedTags = ["b", "i", "u", "em", "strong", "br", "p"];
      const tagMatch = match.match(/^<(\w+)/);
      if (tagMatch && allowedTags.includes(tagMatch[1].toLowerCase())) {
        return match;
      }
      return "";
    })
    .trim();
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_TRACKED_IDENTIFIERS = 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_COOLDOWN_MS = 5 * 60 * 1000;
const LOGIN_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
let lastLoginCleanup = Date.now();

function cleanupExpiredLoginAttempts(): void {
  const now = Date.now();
  if (now - lastLoginCleanup < LOGIN_CLEANUP_INTERVAL_MS) return;
  lastLoginCleanup = now;
  let deleted = 0;
  for (const [key, entry] of loginAttempts.entries()) {
    if (now > entry.resetAt) {
      loginAttempts.delete(key);
      deleted++;
    }
    if (deleted > 100) break;
  }
  if (loginAttempts.size > MAX_TRACKED_IDENTIFIERS) {
    let removed = 0;
    for (const key of loginAttempts.keys()) {
      loginAttempts.delete(key);
      removed++;
      if (removed >= 100) break;
    }
  }
}

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number } {
  cleanupExpiredLoginAttempts();
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: entry.resetAt - now + LOGIN_COOLDOWN_MS };
  }

  entry.count++;
  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  cleanupExpiredLoginAttempts();
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (entry && now < entry.resetAt) {
    entry.count += 2;
  } else {
    loginAttempts.set(identifier, { count: 3, resetAt: now + LOGIN_WINDOW_MS });
  }
}

export function clearLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function getLoginAttemptsRemaining(identifier: string): number {
  cleanupExpiredLoginAttempts();
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    return LOGIN_MAX_ATTEMPTS;
  }

  return Math.max(0, LOGIN_MAX_ATTEMPTS - entry.count);
}