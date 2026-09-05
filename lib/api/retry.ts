export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  maxRateLimitRetries: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelay: 1000,
  maxDelay: 60000,
  maxRateLimitRetries: 3,
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ApiErrorLike {
  status?: number;
  code?: string;
}

function isApiError(error: unknown): error is ApiErrorLike {
  return error !== null && typeof error === "object" && ("status" in error || "code" in error);
}

function getErrorStatus(error: unknown): number | undefined {
  if (isApiError(error)) {
    return error.status;
  }
  return undefined;
}

/**
 * Determines if an error is retryable based on HTTP status code
 * - 429 (rate limit): always retryable (handled separately)
 * - 5xx (server errors): retryable
 * - 408 (timeout): retryable
 * - 4xx (client errors): NOT retryable (except 408, 429)
 */
function isRetryableStatus(status: number): boolean {
  if (status === 429 || status === 408) return true;
  if (status >= 500) return true;
  return false;
}

export class RetryPolicy {
  constructor(private config: RetryConfig = DEFAULT_RETRY_CONFIG) {}

  shouldRetry(attemptIndex: number, error: unknown, isRateLimit = false, isNetworkError = false): boolean {
    if (isRateLimit) {
      return attemptIndex < this.config.maxRateLimitRetries;
    }
    if (isNetworkError) {
      return attemptIndex < this.config.maxRetries;
    }

    // Check if error has a status code that indicates non-retryable
    const status = getErrorStatus(error);
    if (status !== undefined && !isRetryableStatus(status)) {
      return false;
    }

    return attemptIndex < this.config.maxRetries;
  }

  getDelay(attemptIndex: number, retryAfterHeader?: string): number {
    if (retryAfterHeader) {
      const retryAfter = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfter)) {
        return retryAfter * 1000;
      }
    }
    return Math.min(this.config.baseDelay * Math.pow(2, attemptIndex), this.config.maxDelay);
  }

  async executeWithRetry<T>(
    fn: (attemptIndex: number) => Promise<T>,
    options?: { isRateLimit?: boolean; isNetworkError?: boolean }
  ): Promise<T> {
    let attemptIndex = 0;
    const isRateLimit = options?.isRateLimit ?? false;
    const isNetworkError = options?.isNetworkError ?? false;

    while (true) {
      try {
        return await fn(attemptIndex);
      } catch (error) {
        if (!this.shouldRetry(attemptIndex, error, isRateLimit, isNetworkError)) {
          throw error;
        }
        const delay = this.getDelay(attemptIndex);
        await sleep(delay);
        attemptIndex++;
      }
    }
  }
}