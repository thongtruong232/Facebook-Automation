import "dotenv/config";
import { randomUUID } from "node:crypto";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import type { FacebookPage, MediaAsset, SocialPost } from "@prisma/client";
import { AppError, isRetryableError, sanitizeError, toErrorLike } from "../lib/constants";
import { decryptSecret } from "../lib/crypto";
import { env } from "../server/env";
import { logger } from "../server/logger";
import { prisma } from "../server/db";
import { isSupportedVideoMimeType } from "../server/services/media.service";
import { metaService } from "../server/services/meta.service";
import {
  createPublishJobForPost,
  getDueJobs,
  lockJob,
  markJobFailed,
  markJobRetryableFailure,
  markJobSuccess
} from "../server/services/job.service";
import { logError, logInfo, logWarning } from "../server/services/log.service";
import {
  countPublishedTodayForPage,
  getPostForPublish,
  markPostDryRunChecked,
  markPostFailed,
  markPostProcessing,
  markPostPublished,
  markPostQueued
} from "../server/services/post.service";

const workerId = `reels-worker-${process.pid}-${randomUUID()}`;
let processing = false;

type PublishContext = SocialPost & {
  facebookPage: FacebookPage;
  mediaAsset: MediaAsset | null;
};

export async function processDueJobs(): Promise<number> {
  if (processing) {
    logger.warning({
      step: "worker_tick_skipped",
      message: "Previous worker tick is still running.",
      meta: { workerId }
    });
    return 0;
  }

  processing = true;
  try {
    const jobs = await getDueJobs(env.MAX_POSTS_PER_RUN);
    for (const job of jobs) {
      await processJob(job.id);
    }
    return jobs.length;
  } finally {
    processing = false;
  }
}

export async function ensurePublishJobForDuePosts(): Promise<void> {
  const duePosts = await prisma.socialPost.findMany({
    where: {
      status: { in: ["READY", "QUEUED"] },
      scheduledAt: { lte: new Date() }
    },
    select: { id: true },
    take: env.MAX_POSTS_PER_RUN
  });

  for (const post of duePosts) {
    await createPublishJobForPost(post.id);
  }
}

async function processJob(jobId: string): Promise<void> {
  const locked = await lockJob(jobId, workerId);
  if (!locked) return;

  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { id: true, runId: true, socialPostId: true, attempts: true, maxAttempts: true }
  });

  try {
    await logInfo({
      jobId,
      socialPostId: job.socialPostId,
      step: "job_locked",
      message: "Publish job locked by worker.",
      meta: { workerId, runId: job.runId, attempts: job.attempts, maxAttempts: job.maxAttempts }
    });

    const post = await getPostForPublish(job.socialPostId);
    if (!post) {
      throw new AppError("Social post was not found.", {
        statusCode: 404,
        code: "POST_NOT_FOUND",
        retryable: false
      });
    }

    if (post.status === "PUBLISHED") {
      await markJobSuccess(jobId, { skipped: true, reason: "Post already published." });
      await logInfo({
        jobId,
        socialPostId: post.id,
        step: "idempotency_skip",
        message: "Skipped job because post is already published.",
        meta: { facebookVideoId: post.facebookVideoId, facebookPostId: post.facebookPostId }
      });
      return;
    }

    await validatePublishContext(post);
    await markPostProcessing(post.id);

    const accessToken = decryptSecret(post.facebookPage.accessTokenEncrypted, env.TOKEN_ENCRYPTION_KEY);
    const result = await metaService.publishReel({
      pageId: post.facebookPage.pageId,
      pageName: post.facebookPage.name,
      accessToken,
      filePath: post.mediaAsset?.storagePath ?? "",
      caption: post.caption
    });

    if (result.dryRun) {
      await markPostDryRunChecked(post.id);
      await markJobSuccess(jobId, result.rawResponse);
      await logInfo({
        jobId,
        socialPostId: post.id,
        step: "dry_run_ok",
        message: "DRY_RUN completed without calling Meta publish APIs.",
        meta: { facebookVideoId: result.facebookVideoId, facebookPostId: result.facebookPostId }
      });
      return;
    }

    await markPostPublished(post.id, result.facebookVideoId, result.facebookPostId);
    await markJobSuccess(jobId, result.rawResponse);
    await logInfo({
      jobId,
      socialPostId: post.id,
      step: "publish_success",
      message: "Reel published successfully.",
      meta: { facebookVideoId: result.facebookVideoId, facebookPostId: result.facebookPostId }
    });
  } catch (error) {
    await handleJobError(jobId, job.socialPostId, error);
  }
}

async function validatePublishContext(post: PublishContext): Promise<void> {
  if (post.facebookVideoId) {
    throw new AppError("Post already has a facebookVideoId. Manual status check is required before retry.", {
      statusCode: 400,
      code: "IDEMPOTENCY_GUARD",
      retryable: false
    });
  }

  if (post.scheduledAt > new Date()) {
    throw new AppError("Post is not due yet.", {
      statusCode: 400,
      code: "POST_NOT_DUE",
      retryable: false
    });
  }

  if (post.facebookPage.status !== "ACTIVE") {
    throw new AppError("Facebook Page is disabled.", {
      statusCode: 400,
      code: "PAGE_DISABLED",
      retryable: false
    });
  }

  if (!post.facebookPage.accessTokenEncrypted) {
    throw new AppError("Encrypted Page Access Token is missing.", {
      statusCode: 401,
      code: "TOKEN_MISSING",
      retryable: false
    });
  }

  if (!post.mediaAsset || post.mediaAsset.status !== "READY") {
    throw new AppError("Media asset is missing or not ready.", {
      statusCode: 400,
      code: "MEDIA_NOT_READY",
      retryable: false
    });
  }

  if (!isSupportedVideoMimeType(post.mediaAsset.mimeType)) {
    throw new AppError("Media asset must be a supported video MIME type.", {
      statusCode: 400,
      code: "UNSUPPORTED_MEDIA_TYPE",
      retryable: false
    });
  }

  if (!post.caption.trim()) {
    throw new AppError("Caption is required.", {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      retryable: false
    });
  }

  await access(post.mediaAsset.storagePath, fsConstants.R_OK).catch(() => {
    throw new AppError("Video file is missing from local storage.", {
      statusCode: 400,
      code: "MEDIA_FILE_MISSING",
      retryable: false
    });
  });

  const publishedToday = await countPublishedTodayForPage(post.facebookPageId);
  if (publishedToday >= post.facebookPage.dailyLimit) {
    throw new AppError("Page daily publish limit has been reached.", {
      statusCode: 429,
      code: "PAGE_DAILY_LIMIT",
      retryable: true
    });
  }
}

async function handleJobError(jobId: string, socialPostId: string, error: unknown): Promise<void> {
  const latestJob = await prisma.publishJob.findUnique({
    where: { id: jobId },
    select: { attempts: true, maxAttempts: true }
  });

  const retryable = isRetryableError(error);
  const errorLike = toErrorLike(error);
  const message = errorLike.message ?? "Unknown publish error.";

  if (retryable && latestJob && latestJob.attempts < latestJob.maxAttempts) {
    await markJobRetryableFailure(jobId, error);
    await markPostQueued(socialPostId, message);
    await logWarning({
      jobId,
      socialPostId,
      step: "publish_retry_scheduled",
      message: "Publish failed with a retryable error; job was returned to pending.",
      meta: sanitizeError(error)
    });
    return;
  }

  await markJobFailed(jobId, error instanceof Error ? error : new Error(message));
  await markPostFailed(socialPostId, message);
  await logError({
    jobId,
    socialPostId,
    step: "publish_failed",
    message: "Publish job failed and will not retry automatically.",
    meta: sanitizeError(error)
  });
}

async function main() {
  logger.info({
    step: "worker_start",
    message: "Facebook Reels publisher worker started.",
    meta: { workerId, dryRun: env.DRY_RUN, maxPostsPerRun: env.MAX_POSTS_PER_RUN }
  });

  await ensurePublishJobForDuePosts();
  await processDueJobs();

  if (process.env.WORKER_ONCE === "true") {
    await prisma.$disconnect();
    return;
  }

  setInterval(async () => {
    await ensurePublishJobForDuePosts();
    await processDueJobs();
  }, 60_000);
}

main().catch(async (error) => {
  logger.critical({
    step: "worker_crashed",
    message: "Facebook Reels publisher worker crashed.",
    meta: sanitizeError(error)
  });
  await prisma.$disconnect();
  process.exit(1);
});
