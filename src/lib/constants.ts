export const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
export const NON_RETRYABLE_STATUS_CODES = new Set([400, 401, 403, 404]);
export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";

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
        isSensitiveKey(key) ? "[REDACTED]" : sanitizeValue(nestedValue, depth + 1)
      ])
    );
  }

  if (typeof value === "string") {
    return redactString(value);
  }

  return value;
}

export function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    SENSITIVE_KEYS.has(key) ||
    ["token", "secret", "password", "authorization", "cookie"].some((part) => normalized.includes(part))
  );
}

function redactString(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]")
    .replace(/EAAB[A-Za-z0-9._-]+/g, "EAAB[REDACTED]");
}
