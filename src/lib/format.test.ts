import { describe, expect, it } from "vitest";
import { formatBytes, truncate } from "./format";

describe("format helpers", () => {
  it("formats bytes from string and bigint inputs", () => {
    expect(formatBytes("1536")).toBe("1.5 KB");
    expect(formatBytes(2_097_152n)).toBe("2 MB");
  });

  it("truncates long text without changing short text", () => {
    expect(truncate("short", 10)).toBe("short");
    expect(truncate("a long caption", 8)).toBe("a long...");
  });
});
