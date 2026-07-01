import { describe, expect, it } from "vitest";
import { createMediaAssetSchema, mediaUploadSchema } from "./media.validator";

describe("media validation", () => {
  it("accepts application/octet-stream for mock video upload tests", () => {
    const result = mediaUploadSchema.safeParse({
      fileName: "sample.mp4",
      mimeType: "application/octet-stream",
      sizeBytes: 10
    });

    expect(result.success).toBe(true);
  });

  it("validates direct media asset creation input", () => {
    const result = createMediaAssetSchema.safeParse({
      type: "VIDEO",
      filename: "sample.mp4",
      storageDisk: "local",
      storagePath: "./uploads/sample.mp4",
      mimeType: "video/mp4",
      sizeBytes: 10,
      status: "READY"
    });

    expect(result.success).toBe(true);
  });
});
