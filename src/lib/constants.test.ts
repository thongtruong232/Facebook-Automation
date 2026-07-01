import { describe, expect, it } from "vitest";
import { sanitizeError } from "./constants";
import { isRetryableError } from "../server/errors";
import { addBackoffDelay } from "./time";

describe("retry classification", () => {
  it("retries rate limits, timeouts, 5xx, and temporary network errors", () => {
    expect(isRetryableError({ statusCode: 429 })).toBe(true);
    expect(isRetryableError({ statusCode: 503 })).toBe(true);
    expect(isRetryableError(new Error("network timeout while uploading"))).toBe(true);
    expect(isRetryableError(new Error("temporary DNS connect error"))).toBe(true);
  });

  it("does not retry validation, auth, permission, and not found failures", () => {
    expect(isRetryableError({ statusCode: 400 })).toBe(false);
    expect(isRetryableError({ statusCode: 401 })).toBe(false);
    expect(isRetryableError({ statusCode: 403 })).toBe(false);
    expect(isRetryableError(new Error("invalid token"))).toBe(false);
  });

  it("uses capped minute-based backoff delays by attempt number", () => {
    const base = Date.now();

    expect(addBackoffDelay(1).getTime()).toBeGreaterThanOrEqual(base + 60_000);
    expect(addBackoffDelay(4).getTime()).toBeGreaterThanOrEqual(base + 30 * 60_000);
  });
});

describe("error sanitization", () => {
  it("redacts access tokens and authorization values", () => {
    const sanitized = sanitizeError({
      message: "failed",
      access_token: "EAAB-secret",
      headers: { authorization: "Bearer EAAB-secret" }
    });

    expect(JSON.stringify(sanitized)).not.toContain("EAAB-secret");
    expect(JSON.stringify(sanitized)).toContain("[REDACTED]");
  });
});
