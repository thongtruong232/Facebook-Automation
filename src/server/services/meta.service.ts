import { randomUUID } from "node:crypto";
import { AppError } from "../../lib/constants";
import type { PublishReelInput, PublishReelResult, StartReelUploadResult } from "../../types/facebook";
import { env } from "../env";
import { logger } from "../logger";

export class MetaService {
  async testPageToken(pageId: string, accessToken: string): Promise<boolean> {
    this.assertTokenInput(pageId, accessToken);

    if (env.DRY_RUN) {
      logger.info({
        step: "meta_test_token_dry_run",
        message: "Skipped real token validation because DRY_RUN is enabled.",
        meta: { pageId }
      });
      return true;
    }

    throw new AppError("Real Meta token validation is not implemented in this skeleton.", {
      statusCode: 400,
      code: "META_CLIENT_STUB",
      retryable: false
    });
  }

  async startReelUpload(pageId: string, accessToken: string): Promise<StartReelUploadResult> {
    this.assertTokenInput(pageId, accessToken);

    if (env.DRY_RUN) {
      return {
        videoId: `dry-run-video-${randomUUID()}`,
        uploadUrl: "dry-run://facebook-reels-upload"
      };
    }

    throw new AppError("Real Meta Reels upload start is not implemented in this skeleton.", {
      statusCode: 400,
      code: "META_CLIENT_STUB",
      retryable: false
    });
  }

  async uploadVideo(uploadUrl: string, accessToken: string, filePath: string): Promise<void> {
    if (!uploadUrl || !accessToken || !filePath) {
      throw new AppError("Upload URL, token, and file path are required.", {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        retryable: false
      });
    }

    if (env.DRY_RUN) {
      logger.info({
        step: "meta_upload_video_dry_run",
        message: "Skipped real binary upload because DRY_RUN is enabled.",
        meta: { uploadUrl, filePath }
      });
      return;
    }

    throw new AppError("Real Meta binary upload is not implemented in this skeleton.", {
      statusCode: 400,
      code: "META_CLIENT_STUB",
      retryable: false
    });
  }

  async finishReelPublish(
    pageId: string,
    accessToken: string,
    videoId: string,
    caption: string
  ): Promise<Record<string, unknown>> {
    this.assertTokenInput(pageId, accessToken);

    if (!videoId || !caption.trim()) {
      throw new AppError("Video ID and caption are required to finish publishing.", {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        retryable: false
      });
    }

    if (env.DRY_RUN) {
      return {
        id: `dry-run-post-${randomUUID()}`,
        video_id: videoId,
        status: "DRY_RUN_OK"
      };
    }

    throw new AppError("Real Meta Reels finish publish is not implemented in this skeleton.", {
      statusCode: 400,
      code: "META_CLIENT_STUB",
      retryable: false
    });
  }

  async publishReel(input: PublishReelInput): Promise<PublishReelResult> {
    if (!input.caption.trim()) {
      throw new AppError("Caption is required.", {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        retryable: false
      });
    }

    const start = await this.startReelUpload(input.pageId, input.accessToken);
    await this.uploadVideo(start.uploadUrl, input.accessToken, input.filePath);
    const finish = await this.finishReelPublish(input.pageId, input.accessToken, start.videoId, input.caption);

    return {
      facebookVideoId: start.videoId,
      facebookPostId: typeof finish.id === "string" ? finish.id : undefined,
      dryRun: env.DRY_RUN,
      rawResponse: {
        upload: start,
        finish,
        dryRun: env.DRY_RUN,
        graphVersion: env.META_GRAPH_VERSION
      }
    };
  }

  private assertTokenInput(pageId: string, accessToken: string) {
    if (!pageId || !accessToken) {
      throw new AppError("Page ID and Page Access Token are required.", {
        statusCode: 400,
        code: "VALIDATION_ERROR",
        retryable: false
      });
    }
  }
}

export const metaService = new MetaService();
