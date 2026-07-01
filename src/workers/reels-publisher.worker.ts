import "dotenv/config";
import os from "node:os";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import type { FacebookPage, MediaAsset, SocialPost } from "@prisma/client";
import { sanitizeError } from "../lib/constants";
import { decryptSecret } from "../lib/crypto";
import { env } from "../server/env";
import { logger } from "../server/logger";
import { prisma } from "../server/db";
import { metaService } from "../server/services/meta.service";
import {
  createPublishJobForPost,
  getDueJobs,
  lockJob,
  markJobFailed,
  markJobRunning,
  markJobSuccess
} from "../server/services/job.service";
import { logError, logInfo } from "../server/services/log.service";
import {
  countPublishedTodayForPage,
  markPostFailed,
  markPostProcessing,
  markPostPublished
} from "../server/services/post.service";
import { getErrorCode, getErrorMessage, NonRetryableJobError, RetryableJobError, ValidationError } from "../server/errors";

const workerId = `${os.hostname()}-${process.pid}-${Date.now()}`;
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
    if (jobs.length === 0) {
      logger.info("No due publish jobs found.", { step: "worker_no_due_jobs", workerId });
      return 0;
    }

    for (const job of jobs) {
      await processJob(job);
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

type DueJob = Awaited<ReturnType<typeof getDueJobs>>[number];

async function processJob(job: DueJob): Promise<void> {
  const locked = await lockJob(job.id, workerId);
  if (!locked) return;

  try {
    await markJobRunning(job.id);
    await logInfo({
      jobId: job.id,
      socialPostId: job.socialPostId,
      step: "START",
      message: "Publish job started.",
      metaJson: { workerId, jobId: job.id, attempts: job.attempts + 1, maxAttempts: job.maxAttempts }
    });

    const post = job.socialPost;

    await validatePublishContext(post);
    await markPostProcessing(post.id);

    const accessToken = decryptSecret(post.facebookPage.accessTokenEncrypted, env.TOKEN_ENCRYPTION_KEY);
    const result = await metaService.publishReel({
      pageId: post.facebookPage.pageId,
      accessToken,
      videoPath: post.mediaAsset?.storagePath ?? "",
      caption: post.caption,
      dryRun: env.DRY_RUN
    });

    await markPostPublished(post.id, result.facebookVideoId, result.facebookPostId);
    await markJobSuccess(job.id, result.rawResponse);
    await logInfo({
      jobId: job.id,
      socialPostId: post.id,
      step: "SUCCESS",
      message: "Reel published successfully.",
      metaJson: { facebookVideoId: result.facebookVideoId, facebookPostId: result.facebookPostId, dryRun: env.DRY_RUN }
    });
  } catch (error) {
    await handleJobError(job.id, job.socialPostId, error);
  }
}

async function validatePublishContext(post: PublishContext): Promise<void> {
  if (post.status === "PUBLISHED" || post.status === "CANCELLED") {
    throw new NonRetryableJobError(`Post status ${post.status} cannot be published.`, "POST_NOT_PUBLISHABLE", 400);
  }

  if (post.facebookVideoId) {
    throw new NonRetryableJobError("Post already has a facebookVideoId.", "IDEMPOTENCY_GUARD", 400);
  }

  if (!post.facebookPage) {
    throw new ValidationError("Social post is missing Facebook Page.", "PAGE_MISSING");
  }

  if (post.facebookPage.status !== "ACTIVE") {
    throw new NonRetryableJobError("Facebook Page is not active.", "PAGE_NOT_ACTIVE", 400);
  }

  if (!post.facebookPage.accessTokenEncrypted) {
    throw new NonRetryableJobError("Encrypted Page Access Token is missing.", "TOKEN_MISSING", 401);
  }

  if (!post.mediaAsset || post.mediaAsset.status !== "READY") {
    throw new ValidationError("Media asset is missing or not ready.", "MEDIA_NOT_READY");
  }

  if (post.mediaAsset.type !== "VIDEO") {
    throw new ValidationError("Media asset must be a video.", "MEDIA_NOT_VIDEO");
  }

  if (!post.caption.trim()) {
    throw new ValidationError("Caption is required.");
  }

  await access(post.mediaAsset.storagePath, fsConstants.R_OK).catch(() => {
    throw new ValidationError("Video file is missing from local storage.", "MEDIA_FILE_MISSING");
  });

  const publishedToday = await countPublishedTodayForPage(post.facebookPageId);
  if (publishedToday >= post.facebookPage.dailyLimit) {
    throw new RetryableJobError("Page daily publish limit has been reached.", "PAGE_DAILY_LIMIT", 429);
  }
}

async function handleJobError(jobId: string, socialPostId: string, error: unknown): Promise<void> {
  await markJobFailed(jobId, error);
  const updatedJob = await prisma.publishJob.findUnique({
    where: { id: jobId },
    select: { status: true }
  });

  const message = getErrorMessage(error);
  if (updatedJob?.status === "FAILED") {
    await markPostFailed(socialPostId, message);
  }

  await logError({
    jobId,
    socialPostId,
    step: "ERROR",
    message: updatedJob?.status === "PENDING" ? "Publish job failed and was scheduled for retry." : "Publish job failed.",
    metaJson: { errorCode: getErrorCode(error), error: sanitizeError(error), finalStatus: updatedJob?.status }
  });
}

async function main() {
  logger.info("Facebook Reels publisher worker started.", {
    step: "worker_start",
    workerId,
    dryRun: env.DRY_RUN,
    maxPostsPerRun: env.MAX_POSTS_PER_RUN
  });

  await ensurePublishJobForDuePosts();
  await processDueJobs();

  await prisma.$disconnect();
}

main().catch(async (error) => {
  logger.critical("Facebook Reels publisher worker crashed.", {
    step: "worker_crashed",
    error: sanitizeError(error)
  });
  await prisma.$disconnect();
  process.exit(1);
});
