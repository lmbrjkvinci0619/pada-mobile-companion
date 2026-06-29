export const ErrorCode = {
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  REFRESH_FAILED: "REFRESH_FAILED",
  UNKNOWN: "UNKNOWN",
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];

export const RecoveryStrategy = {
  RETRY: "RETRY",
  REFRESH_TOKEN: "REFRESH_TOKEN",
  LOGOUT: "LOGOUT",
  RELOAD: "RELOAD",
  CONTACT_SUPPORT: "CONTACT_SUPPORT",
  NONE: "NONE",
} as const;

export type RecoveryStrategyType = typeof RecoveryStrategy[keyof typeof RecoveryStrategy];

interface ErrorDetails {
  code: ErrorCodeType;
  strategy: RecoveryStrategyType;
  statusCode?: number;
}

const errorDetailsMap: Record<string, ErrorDetails> = {
  [ErrorCode.NETWORK_ERROR]: { code: ErrorCode.NETWORK_ERROR, strategy: RecoveryStrategy.RETRY },
  [ErrorCode.TIMEOUT]: { code: ErrorCode.TIMEOUT, strategy: RecoveryStrategy.RETRY },
  [ErrorCode.SERVER_ERROR]: { code: ErrorCode.SERVER_ERROR, strategy: RecoveryStrategy.RETRY },
  [ErrorCode.NOT_FOUND]: { code: ErrorCode.NOT_FOUND, strategy: RecoveryStrategy.RELOAD },
  [ErrorCode.UNAUTHORIZED]: { code: ErrorCode.UNAUTHORIZED, strategy: RecoveryStrategy.REFRESH_TOKEN },
  [ErrorCode.FORBIDDEN]: { code: ErrorCode.FORBIDDEN, strategy: RecoveryStrategy.CONTACT_SUPPORT },
  [ErrorCode.VALIDATION_ERROR]: { code: ErrorCode.VALIDATION_ERROR, strategy: RecoveryStrategy.RETRY },
  [ErrorCode.RATE_LIMITED]: { code: ErrorCode.RATE_LIMITED, strategy: RecoveryStrategy.NONE },
  [ErrorCode.TOKEN_EXPIRED]: { code: ErrorCode.TOKEN_EXPIRED, strategy: RecoveryStrategy.REFRESH_TOKEN },
  [ErrorCode.TOKEN_INVALID]: { code: ErrorCode.TOKEN_INVALID, strategy: RecoveryStrategy.LOGOUT },
  [ErrorCode.REFRESH_FAILED]: { code: ErrorCode.REFRESH_FAILED, strategy: RecoveryStrategy.LOGOUT },
};

export class ApiError extends Error {
  public readonly code: ErrorCodeType;
  public readonly status?: number;
  public readonly strategy: RecoveryStrategyType;

  constructor(
    message: string,
    status?: number,
    code: ErrorCodeType = ErrorCode.UNKNOWN
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    
    const details = errorDetailsMap[code] || { code, strategy: RecoveryStrategy.NONE };
    this.strategy = details.strategy;
  }

  static fromStatus(status: number, message?: string): ApiError {
    const code = status === 401 ? ErrorCode.UNAUTHORIZED
      : status === 403 ? ErrorCode.FORBIDDEN
      : status === 404 ? ErrorCode.NOT_FOUND
      : status === 429 ? ErrorCode.RATE_LIMITED
      : status >= 500 ? ErrorCode.SERVER_ERROR
      : ErrorCode.UNKNOWN;
    
    const defaultMessages: Record<number, string> = {
      401: "Session expired. Please log in again.",
      403: "You don't have permission to perform this action.",
      404: "The requested resource was not found.",
      429: "Too many requests. Please wait a moment.",
      500: "Server error. Please try again later.",
      502: "Service unavailable. Please try again later.",
      503: "Service unavailable. Please try again later.",
    };

    return new ApiError(
      message || defaultMessages[status] || "An API error occurred",
      status,
      code
    );
  }
}

export class AuthError extends Error {
  public readonly code: ErrorCodeType;
  public readonly strategy: RecoveryStrategyType;

  constructor(
    message = "Authentication required",
    code: ErrorCodeType = ErrorCode.UNAUTHORIZED
  ) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.strategy = code === ErrorCode.TOKEN_INVALID || code === ErrorCode.REFRESH_FAILED
      ? RecoveryStrategy.LOGOUT
      : RecoveryStrategy.REFRESH_TOKEN;
  }
}

export class NetworkError extends Error {
  public readonly code: ErrorCodeType;
  public readonly strategy: RecoveryStrategyType;

  constructor(message = "Network error. Please try again.") {
    super(message);
    this.name = "NetworkError";
    this.code = ErrorCode.NETWORK_ERROR;
    this.strategy = RecoveryStrategy.RETRY;
  }
}

export class CacheError extends Error {
  public readonly code: ErrorCodeType;
  public readonly strategy: RecoveryStrategyType;

  constructor(message = "Cache operation failed") {
    super(message);
    this.name = "CacheError";
    this.code = ErrorCode.UNKNOWN;
    this.strategy = RecoveryStrategy.RETRY;
  }
}

export function getErrorDetails(error: unknown): ErrorDetails {
  if (error instanceof ApiError) {
    return { code: error.code, strategy: error.strategy, statusCode: error.status };
  }
  if (error instanceof AuthError) {
    return { code: error.code, strategy: error.strategy };
  }
  if (error instanceof NetworkError) {
    return { code: error.code, strategy: error.strategy };
  }
  if (error instanceof CacheError) {
    return { code: error.code, strategy: error.strategy };
  }
  return { code: ErrorCode.UNKNOWN, strategy: RecoveryStrategy.NONE };
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError || (error instanceof TypeError && error.message.includes("network"));
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}

export function handleErrorStrategy(error: unknown): void {
  const { strategy } = getErrorDetails(error);

  switch (strategy) {
  case RecoveryStrategy.LOGOUT:
    import("@/store/authStore").then(({ useAuthStore }) => useAuthStore.getState().logout()).catch(() => {});
    break;
  case RecoveryStrategy.REFRESH_TOKEN:
    break;
  default:
    break;
  }
}