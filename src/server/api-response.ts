import { sanitizeError } from "../lib/constants";

export function ok<T>(data: T, init?: ResponseInit): Response {
  return json(
    {
      success: true,
      data
    },
    init
  );
}

export function fail(message: string, status = 500, details?: unknown): Response {
  return json(
    {
      success: false,
      error: {
        message,
        details: details === undefined ? undefined : sanitizeResponseDetails(details)
      }
    },
    { status }
  );
}

export function serializeBigInt(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeBigInt);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeBigInt(item)]));
  }
  return value;
}

function json(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(serializeBigInt(body)), {
    ...init,
    headers
  });
}

function sanitizeResponseDetails(details: unknown): unknown {
  const sanitized = sanitizeError(details);
  if (process.env.NODE_ENV !== "production") return sanitized;

  if (sanitized && typeof sanitized === "object" && "message" in sanitized) {
    return { message: String(sanitized.message) };
  }

  return sanitized;
}
