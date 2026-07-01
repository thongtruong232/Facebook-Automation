import { sanitizeError } from "../lib/constants";
import { env } from "./env";

type LogLevel = "debug" | "info" | "warning" | "error" | "critical";

type LogPayload = {
  step?: string;
  message: string;
  meta?: unknown;
};

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    app: "facebook-reels-automation",
    step: payload.step,
    message: payload.message,
    meta: payload.meta ? sanitizeError(payload.meta) : undefined
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
  debug: (payload: LogPayload) => write("debug", payload),
  info: (payload: LogPayload) => write("info", payload),
  warning: (payload: LogPayload) => write("warning", payload),
  error: (payload: LogPayload) => write("error", payload),
  critical: (payload: LogPayload) => write("critical", payload)
};
