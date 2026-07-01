import { describe, expect, it, vi } from "vitest";
import { addBackoffDelay, now } from "./time";

describe("time helpers", () => {
  it("returns the current time through now()", () => {
    const fixed = new Date("2026-07-01T00:00:00.000Z");
    vi.setSystemTime(fixed);

    expect(now().toISOString()).toBe(fixed.toISOString());

    vi.useRealTimers();
  });

  it("adds minute-based retry backoff delays", () => {
    vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));

    expect(addBackoffDelay(1).toISOString()).toBe("2026-07-01T00:01:00.000Z");
    expect(addBackoffDelay(2).toISOString()).toBe("2026-07-01T00:03:00.000Z");
    expect(addBackoffDelay(3).toISOString()).toBe("2026-07-01T00:10:00.000Z");
    expect(addBackoffDelay(4).toISOString()).toBe("2026-07-01T00:30:00.000Z");

    vi.useRealTimers();
  });
});
