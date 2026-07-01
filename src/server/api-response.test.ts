import { afterEach, describe, expect, it, vi } from "vitest";
import { fail, ok } from "./api-response";

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("api-response helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("wraps successful data and serializes BigInt values", async () => {
    const response = ok({ sizeBytes: 123n });

    await expect(readJson(response)).resolves.toEqual({
      success: true,
      data: { sizeBytes: "123" }
    });
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("wraps errors without leaking production stack traces", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = fail("Upload failed", 400, new Error("private stack"));
    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        message: "Upload failed",
        details: { message: "private stack" }
      }
    });
  });
});
