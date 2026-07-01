import { describe, expect, it } from "vitest";
import { createPostSchema, schedulePostSchema } from "./post.validator";

describe("post validation", () => {
  it("requires page, media, caption, type, and scheduled date for a Reel", () => {
    const result = createPostSchema.safeParse({
      facebookPageId: "",
      mediaAssetId: "",
      type: "REEL",
      caption: "",
      scheduledAt: ""
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid scheduled Reel input", () => {
    const result = createPostSchema.safeParse({
      facebookPageId: "page-uuid",
      mediaAssetId: "media-uuid",
      type: "REEL",
      caption: "Launch caption",
      scheduledAt: "2026-07-01T12:00:00.000Z",
      intent: "schedule"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid schedule date", () => {
    const result = schedulePostSchema.safeParse({ scheduledAt: "not-a-date" });

    expect(result.success).toBe(false);
  });
});
