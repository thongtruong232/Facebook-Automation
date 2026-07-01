import { describe, expect, it } from "vitest";
import { formatBytes, formatDateTimeLocal, formatStatus, truncate } from "./format";

describe("format helpers", () => {
  it("formats bytes from string and bigint inputs", () => {
    expect(formatBytes("1536")).toBe("1.5 KB");
    expect(formatBytes(2_097_152n)).toBe("2 MB");
  });

  it("truncates long text without changing short text", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a long caption", 8)).toBe("a long...");
  });

  it("formats status constants into readable labels", () => {
    expect(formatStatus("TOKEN_INVALID")).toBe("Token invalid");
    expect(formatStatus("publish_reel")).toBe("Publish reel");
    expect(formatStatus("")).toBe("-");
  });

  it("formats values for datetime-local inputs", () => {
    expect(formatDateTimeLocal(new Date("2026-07-01T09:30:00"))).toBe("2026-07-01T09:30");
    expect(formatDateTimeLocal("not-a-date")).toBe("");
    expect(formatDateTimeLocal(null)).toBe("");
  });
});
