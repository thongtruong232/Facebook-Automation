export const RETRYABLE_HTTP_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
export const NON_RETRYABLE_HTTP_STATUS_CODES = new Set([400, 401, 403, 404]);
export const RETRY_DELAYS_MS = [1000, 3000, 10000, 30000] as const;

const SENSITIVE_KEYS = new Set([
  "access_token",
  "accessToken",
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
  "password",
  "token",
  "pageAccessToken",
  "app_secret",
  "appSecret"
]);

const NON_RETRYABLE_MESSAGE_PATTERNS = [
  /validation/i,
  /permission/i,
  /invalid token/i,
  /unauthorized/i,
  /forbidden/i,
  /unsupported endpoint/i,
  /not found/i
];

const RETRYABLE_MESSAGE_PATTERNS = [
  /timeout/i,
  /rate limit/i,
  /temporary/i,
  /dns/i,
  /econnreset/i,
  /econnrefused/i,
  /network/i,
  /bad gateway/i,
  /service unavailable/i,
  /gateway timeout/i
];

export type ErrorLike = {
  statusCode?: number;
  code?: string;
  message?: string;
  retryable?: boolean;
  retryAfterMs?: number;
};

export class AppError extends Error {
  statusCode?: number;
  code?: string;
  retryable?: boolean;
  retryAfterMs?: number;

  constructor(message: string, options: ErrorLike = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.retryable = options.retryable;
    this.retryAfterMs = options.retryAfterMs;
  }
}

export function getRetryDelayMs(attempt: number, retryAfterMs?: number): number {
  if (retryAfterMs && retryAfterMs > 0) {
    return retryAfterMs;
  }

  const index = Math.max(0, Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1));
  return RETRY_DELAYS_MS[index];
}

export function isRetryableError(error: unknown): boolean {
  const errorLike = toErrorLike(error);

  if (typeof errorLike.retryable === "boolean") {
    return errorLike.retryable;
  }

  if (typeof errorLike.statusCode === "number") {
    if (RETRYABLE_HTTP_STATUS_CODES.has(errorLike.statusCode)) return true;
    if (NON_RETRYABLE_HTTP_STATUS_CODES.has(errorLike.statusCode)) return false;
  }

  const message = errorLike.message ?? "";
  if (NON_RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return false;
  }

  return RETRYABLE_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

export function toErrorLike(error: unknown): ErrorLike {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      retryAfterMs: error.retryAfterMs
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === "object" && error !== null) {
    return error as ErrorLike;
  }

  return { message: String(error) };
}

export function sanitizeError(error: unknown): unknown {
  return sanitizeValue(error, 0);
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 8) {
    return "[TRUNCATED]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message)
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? "[REDACTED]" : sanitizeValue(nestedValue, depth + 1)
      ])
    );
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  return value;
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]")
    .replace(/EAAB[A-Za-z0-9._-]+/g, "EAAB[REDACTED]");
}
