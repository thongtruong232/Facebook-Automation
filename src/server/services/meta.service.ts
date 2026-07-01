import { access } from "node:fs/promises";
import type { PublishReelInput, PublishReelResult, StartReelUploadResult } from "../../types/facebook";
import { MetaApiNotImplementedError, ValidationError } from "../errors";
import { env } from "../env";
import { logger } from "../logger";

type MetaServiceOptions = {
  dryRun?: boolean;
};

export class MetaService {
  private readonly dryRunOverride?: boolean;

  constructor(options: MetaServiceOptions = {}) {
    this.dryRunOverride = options.dryRun;
  }

  async testPageToken(pageId: string, accessToken: string): Promise<boolean> {
    this.assertTokenInput(pageId, accessToken);

    if (this.isDryRun()) {
      logger.info("Skipped real token validation because DRY_RUN is enabled.", { step: "meta_test_token_dry_run", pageId });
      return true;
    }

    throw new MetaApiNotImplementedError();
  }

  async startReelUpload(
    pageId: string,
    accessToken: string,
    dryRun = this.isDryRun()
  ): Promise<StartReelUploadResult> {
    this.assertTokenInput(pageId, accessToken);

    if (dryRun) {
      const timestamp = Date.now();
      return {
        videoId: `mock_video_${timestamp}`,
        uploadUrl: `mock_upload_url_${timestamp}`
      };
    }

    throw new MetaApiNotImplementedError();
  }

  async uploadVideo(uploadUrl: string, accessToken: string, filePath: string, dryRun = this.isDryRun()): Promise<void> {
    if (!uploadUrl || !accessToken || !filePath) {
      throw new ValidationError("Upload URL, token, and file path are required.");
    }

    if (dryRun) {
      await this.assertFileExists(filePath);
      logger.info("Skipped real binary upload because DRY_RUN is enabled.", {
        step: "meta_upload_video_dry_run",
        uploadUrl,
        filePath
      });
      return;
    }

    throw new MetaApiNotImplementedError();
  }

  async finishReelPublish(
    pageId: string,
    accessToken: string,
    videoId: string,
    caption: string,
    dryRun = this.isDryRun()
  ): Promise<Record<string, unknown>> {
    this.assertTokenInput(pageId, accessToken);

    if (!videoId || !caption.trim()) {
      throw new ValidationError("Video ID and caption are required to finish publishing.");
    }

    if (dryRun) {
      return {
        id: `mock_post_${Date.now()}`,
        video_id: videoId,
        status: "DRY_RUN_OK"
      };
    }

    throw new MetaApiNotImplementedError();
  }

  async publishReel(input: PublishReelInput): Promise<PublishReelResult> {
    this.assertTokenInput(input.pageId, input.accessToken);

    if (!input.videoPath) {
      throw new ValidationError("Video path is required.");
    }

    if (!input.caption.trim()) {
      throw new ValidationError("Caption is required.");
    }

    const dryRun = this.isDryRun(input.dryRun);
    if (!dryRun) {
      throw new MetaApiNotImplementedError();
    }

    const start = await this.startReelUpload(input.pageId, input.accessToken, dryRun);
    await this.uploadVideo(start.uploadUrl, input.accessToken, input.videoPath, dryRun);
    const finish = await this.finishReelPublish(
      input.pageId,
      input.accessToken,
      start.videoId,
      input.caption,
      dryRun
    );

    return {
      facebookVideoId: start.videoId,
      facebookPostId: typeof finish.id === "string" ? finish.id : undefined,
      rawResponse: {
        upload: start,
        finish,
        dryRun: true,
        graphVersion: env.META_GRAPH_VERSION
      }
    };
  }

  private assertTokenInput(pageId: string, accessToken: string) {
    if (!pageId || !accessToken) {
      throw new ValidationError("Page ID and Page Access Token are required.");
    }
  }

  private async assertFileExists(filePath: string): Promise<void> {
    await access(filePath).catch(() => {
      throw new ValidationError(`Video file does not exist: ${filePath}`, "VIDEO_FILE_MISSING");
    });
  }

  private isDryRun(inputDryRun?: boolean): boolean {
    return inputDryRun ?? this.dryRunOverride ?? env.DRY_RUN;
  }
}

export const metaService = new MetaService();
