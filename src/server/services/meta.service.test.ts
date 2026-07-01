import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MetaService } from "./meta.service";
import { MetaApiNotImplementedError, ValidationError } from "../errors";

const tmpDir = path.join(process.cwd(), "tmp-meta-service-test");
const videoPath = path.join(tmpDir, "sample.mp4");

describe("MetaService mock", () => {
  beforeEach(async () => {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(videoPath, "fake video");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("returns fake video and post IDs during dry-run without network calls", async () => {
    const result = await new MetaService({ dryRun: true }).publishReel({
      pageId: "page_1",
      accessToken: "test_token",
      videoPath,
      caption: "Dry-run test reel"
    });

    expect(result.facebookVideoId).toMatch(/^mock_video_\d+$/);
    expect(result.facebookPostId).toMatch(/^mock_post_\d+$/);
    expect(result.rawResponse.dryRun).toBe(true);
  });

  it("throws ValidationError when dry-run video file is missing", async () => {
    await expect(
      new MetaService({ dryRun: true }).publishReel({
        pageId: "page_1",
        accessToken: "test_token",
        videoPath: path.join(tmpDir, "missing.mp4"),
        caption: "Dry-run test reel"
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws a clear not-implemented error when dry-run is disabled", async () => {
    await expect(
      new MetaService({ dryRun: false }).publishReel({
        pageId: "page_1",
        accessToken: "test_token",
        videoPath,
        caption: "Dry-run test reel"
      })
    ).rejects.toBeInstanceOf(MetaApiNotImplementedError);
  });

  it("honors per-call dryRun override through the full publish flow", async () => {
    const result = await new MetaService({ dryRun: false }).publishReel({
      pageId: "page_1",
      accessToken: "test_token",
      videoPath,
      caption: "Dry-run test reel",
      dryRun: true
    });

    expect(result.facebookVideoId).toMatch(/^mock_video_\d+$/);
    expect(result.rawResponse.dryRun).toBe(true);
  });
});
