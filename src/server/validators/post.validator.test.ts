import { describe, expect, it } from "vitest";
import { createPostSchema, schedulePostSchema, updatePostSchema } from "./post.validator";

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

  it("allows draft post input without a scheduled date", () => {
    const result = createPostSchema.safeParse({
      facebookPageId: "page-uuid",
      mediaAssetId: "media-uuid",
      type: "REEL",
      caption: "Draft caption",
      status: "DRAFT"
    });

    expect(result.success).toBe(true);
  });

  it("allows partial post updates before processing", () => {
    const result = updatePostSchema.safeParse({
      caption: "Updated caption",
      status: "READY"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid schedule date", () => {
    const result = schedulePostSchema.safeParse({ scheduledAt: "not-a-date" });

    expect(result.success).toBe(false);
  });
});
