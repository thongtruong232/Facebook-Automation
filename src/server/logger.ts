import { isSensitiveKey, sanitizeError } from "../lib/constants";
import { env } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

type LogPayload = {
  step?: string;
  message: string;
  meta?: unknown;
};

type LogInput = string | LogPayload;

function write(level: LogLevel, input: LogInput, meta?: unknown) {
  const payload = typeof input === "string" ? { message: input, meta } : input;
  const entry = {
    timestamp: new Date().toISOString(),
    level: level === "warn" ? "WARNING" : level.toUpperCase(),
    app: "facebook-reels-automation",
    step: payload.step,
    message: payload.message,
    meta: payload.meta ? sanitizeMeta(payload.meta) : undefined
  };

  const line = JSON.stringify(entry);
  if (level === "error" || level === "critical") {
    console.error(line);
    return;
  }

  if (level === "debug" && env.APP_ENV !== "development") {
    return;
  }

  console.log(line);
}

export const logger = {
  debug: (input: LogInput, meta?: unknown) => write("debug", input, meta),
  info: (input: LogInput, meta?: unknown) => write("info", input, meta),
  warn: (input: LogInput, meta?: unknown) => write("warn", input, meta),
  warning: (input: LogInput, meta?: unknown) => write("warn", input, meta),
  error: (input: LogInput, meta?: unknown) => write("error", input, meta),
  critical: (input: LogInput, meta?: unknown) => write("critical", input, meta)
};

export function sanitizeMeta(meta: unknown): unknown {
  if (Array.isArray(meta)) {
    return meta.map((item) => sanitizeMeta(item));
  }

  if (typeof meta === "object" && meta !== null) {
    return Object.fromEntries(
      Object.entries(meta).map(([key, value]) => [key, isSensitiveKey(key) ? "[REDACTED]" : sanitizeMeta(value)])
    );
  }

  return sanitizeError(meta);
}
