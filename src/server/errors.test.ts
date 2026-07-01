import { describe, expect, it } from "vitest";
import {
  getErrorCode,
  getErrorMessage,
  isRetryableError,
  MetaApiNotImplementedError,
  NonRetryableJobError,
  RetryableJobError,
  ValidationError
} from "./errors";

describe("job error classification", () => {
  it("marks retryable job errors and transient status codes as retryable", () => {
    expect(isRetryableError(new RetryableJobError("rate limited", "RATE_LIMIT", 429))).toBe(true);
    expect(isRetryableError({ statusCode: 503, message: "service unavailable" })).toBe(true);
    expect(isRetryableError(new Error("network timeout"))).toBe(true);
  });

  it("marks validation, permissions, invalid tokens, and not found as non-retryable", () => {
    expect(isRetryableError(new ValidationError("caption required"))).toBe(false);
    expect(isRetryableError(new NonRetryableJobError("permission error", "PERMISSION_ERROR", 403))).toBe(false);
    expect(isRetryableError(new Error("invalid token"))).toBe(false);
    expect(isRetryableError({ statusCode: 404, message: "missing file" })).toBe(false);
  });

  it("returns stable error code and message values", () => {
    const error = new MetaApiNotImplementedError();

    expect(getErrorCode(error)).toBe("META_API_NOT_IMPLEMENTED");
    expect(getErrorMessage(error)).toContain("Meta API real publishing is not implemented yet");
  });
});
