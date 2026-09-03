export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  TOKEN_REFRESH_SUCCESS = "TOKEN_REFRESH_SUCCESS",
  TOKEN_REFRESH_FAILURE = "TOKEN_REFRESH_FAILURE",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  BIOMETRIC_SUCCESS = "BIOMETRIC_SUCCESS",
  BIOMETRIC_FAILURE = "BIOMETRIC_FAILURE",
  BIOMETRIC_ENABLED = "BIOMETRIC_ENABLED",
  BIOMETRIC_DISABLED = "BIOMETRIC_DISABLED",
  SENSITIVE_OPERATION = "SENSITIVE_OPERATION",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  RATE_LIMIT_BLOCKED = "RATE_LIMIT_BLOCKED",
}

interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  userId?: string;
  ipHash?: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
}

const MAX_EVENTS = 100;
const eventLog: SecurityEvent[] = [];
let deviceIdHash: string | null = null;
let deviceFingerprint: string | null = null;

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function setDeviceIdentifier(deviceId: string): void {
  deviceIdHash = hashString(deviceId);
}

export function getDeviceFingerprint(): string {
  if (deviceFingerprint) return deviceFingerprint;

  const components: string[] = [];

  if (typeof navigator !== "undefined") {
    components.push(navigator?.userAgent ?? "unknown");
    components.push(navigator?.platform ?? "unknown");
    components.push(String(navigator?.hardwareConcurrency ?? 0));
  } else {
    components.push("rn-no-navigator");
  }

  if (typeof screen !== "undefined") {
    components.push(String(screen?.width ?? 0));
    components.push(String(screen?.height ?? 0));
    components.push(String(screen?.colorDepth ?? 0));
  } else {
    components.push("rn-no-screen");
  }

  try {
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown");
    components.push(Intl.DateTimeFormat().resolvedOptions().locale ?? "unknown");
  } catch {
    components.push("intl-unavailable");
  }

  const combined = components.join("|");
  deviceFingerprint = hashString(combined);

  return deviceFingerprint;
}

export function logSecurityEvent(
  type: SecurityEventType,
  options?: {
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const event: SecurityEvent = {
    type,
    timestamp: Date.now(),
    deviceId: deviceIdHash ?? undefined,
    metadata: sanitizeMetadata(options?.metadata),
  };

  if (options?.userId) {
    event.userId = hashString(options.userId);
  }

  eventLog.push(event);

  if (eventLog.length > MAX_EVENTS) {
    eventLog.shift();
  }

  const level = getEventLogLevel(type);
  const prefix = level === "error" ? "[SECURITY ERROR]" : "[SECURITY]";
  console.log(`${prefix} ${type}`, {
    timestamp: new Date(event.timestamp).toISOString(),
    userId: event.userId,
    deviceId: event.deviceId,
    deviceFingerprint: getDeviceFingerprint(),
    ...event.metadata,
  });
}

function getEventLogLevel(type: SecurityEventType): "info" | "warn" | "error" {
  switch (type) {
    case SecurityEventType.LOGIN_SUCCESS:
    case SecurityEventType.TOKEN_REFRESH_SUCCESS:
    case SecurityEventType.BIOMETRIC_SUCCESS:
    case SecurityEventType.LOGOUT:
      return "info";
    case SecurityEventType.LOGIN_FAILURE:
    case SecurityEventType.TOKEN_REFRESH_FAILURE:
    case SecurityEventType.BIOMETRIC_FAILURE:
    case SecurityEventType.RATE_LIMIT_BLOCKED:
    case SecurityEventType.SESSION_EXPIRED:
      return "warn";
    case SecurityEventType.TOKEN_EXPIRED:
      return "error";
    default:
      return "info";
  }
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "accessToken",
    "refreshToken",
    "apiKey",
    "api_csrf",
    "auth_token",
  ];

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 100) {
      sanitized[key] = value.slice(0, 100) + "... [TRUNCATED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function getSecurityEvents(limit: number = 50): SecurityEvent[] {
  return eventLog.slice(-limit);
}

export function clearSecurityEvents(): void {
  eventLog.length = 0;
}

export function getSecurityEventsByType(type: SecurityEventType, limit: number = 50): SecurityEvent[] {
  return eventLog.filter((e) => e.type === type).slice(-limit);
}

export function hasRecentSecurityEvents(
  type: SecurityEventType,
  withinMs: number = 60000
): boolean {
  const cutoff = Date.now() - withinMs;
  return eventLog.some((e) => e.type === type && e.timestamp > cutoff);
}

export function getFailedLoginAttemptsCount(withinMs: number = 900000): number {
  const cutoff = Date.now() - withinMs;
  return eventLog.filter(
    (e) => e.type === SecurityEventType.LOGIN_FAILURE && e.timestamp > cutoff
  ).length;
}

export function getBiometricFailureCount(withinMs: number = 300000): number {
  const cutoff = Date.now() - withinMs;
  return eventLog.filter(
    (e) => e.type === SecurityEventType.BIOMETRIC_FAILURE && e.timestamp > cutoff
  ).length;
}