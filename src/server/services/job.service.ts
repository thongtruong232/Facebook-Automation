import type { Prisma, PublishJob, PublishJobStatus } from "@prisma/client";
import { sanitizeError } from "../../lib/constants";
import { addBackoffDelay } from "../../lib/time";
import { getErrorCode, getErrorMessage, isRetryableError, ValidationError } from "../errors";
import { prisma } from "../db";
import { env } from "../env";

export async function createPublishJobForPost(postId: string): Promise<PublishJob> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      scheduledAt: true,
      maxAttempts: true,
      status: true,
      facebookVideoId: true,
      type: true
    }
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (post.status === "PUBLISHED" || post.facebookVideoId) {
    throw new ValidationError("Post is already published or has a video ID.", "IDEMPOTENCY_GUARD");
  }

  if (!["READY", "QUEUED", "DRAFT"].includes(post.status)) {
    throw new ValidationError(`Cannot create publish job for post status ${post.status}.`, "INVALID_POST_STATUS");
  }

  const activeJob = await prisma.publishJob.findFirst({
    where: {
      socialPostId: postId,
      status: { in: ["PENDING", "RUNNING"] }
    },
  });

  if (activeJob) {
    return activeJob;
  }

  const job = await prisma.publishJob.create({
    data: {
      socialPostId: postId,
      jobType: "PUBLISH_REEL",
      status: "PENDING",
      runAt: post.scheduledAt,
      maxAttempts: post.maxAttempts || env.MAX_RETRY
    }
  });

  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: "QUEUED" }
  });

  return job;
}

export async function getDueJobs(limit: number) {
  return prisma.publishJob.findMany({
    where: {
      status: "PENDING",
      runAt: { lte: new Date() },
      attempts: { lt: prisma.publishJob.fields.maxAttempts }
    },
    orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      socialPost: {
        include: {
          facebookPage: true,
          mediaAsset: true
        }
      }
    }
  });
}

export async function lockJob(jobId: string, workerId: string): Promise<boolean> {
  const result = await prisma.publishJob.updateMany({
    where: {
      id: jobId,
      status: "PENDING",
      lockedAt: null
    },
    data: {
      lockedAt: new Date(),
      lockedBy: workerId
    }
  });

  return result.count === 1;
}

export async function markJobSuccess(jobId: string, response: unknown): Promise<void> {
  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: "SUCCESS",
      finishedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
      errorCode: null,
      errorMessage: null,
      rawResponseJson: sanitizeError(response) as Prisma.InputJsonValue
    }
  });
}

export async function markJobFailed(jobId: string, error: unknown): Promise<void> {
  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { attempts: true, maxAttempts: true }
  });
  const retryable = isRetryableError(error);
  const finalFailed = !retryable || job.attempts >= job.maxAttempts;

  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: finalFailed ? "FAILED" : "PENDING",
      runAt: finalFailed ? undefined : addBackoffDelay(job.attempts),
      finishedAt: finalFailed ? new Date() : null,
      lockedAt: null,
      lockedBy: null,
      errorCode: getErrorCode(error),
      errorMessage: getErrorMessage(error),
      rawResponseJson: sanitizeError(error) as Prisma.InputJsonValue
    }
  });
}

export async function retryJob(jobId: string): Promise<void> {
  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { socialPost: { select: { status: true } } }
  });

  if (job.status !== "FAILED") {
    throw new ValidationError("Only failed jobs can be retried manually.", "JOB_NOT_FAILED");
  }

  if (job.socialPost.status === "PUBLISHED") {
    throw new ValidationError("Published posts cannot be retried.", "IDEMPOTENCY_GUARD");
  }

  await prisma.$transaction([
    prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        runAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        startedAt: null,
        finishedAt: null,
        errorCode: null,
        errorMessage: null,
        // TODO: Decide whether manual retry should extend maxAttempts or require a separate override workflow.
        maxAttempts: job.attempts >= job.maxAttempts ? job.attempts + 1 : job.maxAttempts
      }
    }),
    prisma.socialPost.update({
      where: { id: job.socialPostId },
      data: {
        status: "QUEUED",
        lastError: null
      }
    })
  ]);
}

export async function cancelPendingJobsForPost(postId: string): Promise<void> {
  await prisma.publishJob.updateMany({
    where: {
      socialPostId: postId,
      status: "PENDING"
    },
    data: {
      status: "CANCELLED",
      finishedAt: new Date(),
      lockedAt: null,
      lockedBy: null
    }
  });
}

export async function retryLatestJobForPost(postId: string): Promise<void> {
  const job = await prisma.publishJob.findFirst({
    where: { socialPostId: postId, status: "FAILED" },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });

  if (job) {
    await retryJob(job.id);
    return;
  }

  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { status: true }
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (post.status === "PUBLISHED") {
    throw new ValidationError("Published posts cannot be retried.", "IDEMPOTENCY_GUARD");
  }

  if (post.status === "FAILED") {
    await prisma.socialPost.update({
      where: { id: postId },
      data: { status: "READY", lastError: null }
    });
  }

  await createPublishJobForPost(postId);
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "QUEUED",
      lastError: null
    }
  });
}

export async function cancelJob(jobId: string): Promise<void> {
  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { socialPostId: true, status: true }
  });

  if (job.status !== "PENDING") {
    throw new ValidationError("Only pending jobs can be cancelled.", "JOB_NOT_CANCELABLE");
  }

  await prisma.$transaction([
    prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        finishedAt: new Date(),
        lockedAt: null
      }
    }),
    prisma.socialPost.update({
      where: { id: job.socialPostId },
      data: { status: "CANCELLED" }
    })
  ]);
}

export async function markJobRunning(jobId: string): Promise<void> {
  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      attempts: { increment: 1 }
    }
  });
}

export async function listJobs() {
  return listPublishJobs();
}

export async function listPublishJobs(filters: { status?: PublishJobStatus; limit?: number } = {}) {
  return prisma.publishJob.findMany({
    orderBy: { runAt: "desc" },
    take: filters.limit ?? 100,
    where: { status: filters.status },
    include: {
      socialPost: {
        select: {
          id: true,
          caption: true,
          status: true,
          mediaAsset: { select: { filename: true, originalName: true } },
          facebookPage: { select: { name: true } }
        }
      }
    }
  });
}

export async function getPublishJob(jobId: string) {
  const job = await prisma.publishJob.findUnique({
    where: { id: jobId },
    include: {
      jobLogs: { orderBy: { createdAt: "desc" } },
      socialPost: {
        include: {
          facebookPage: { select: { id: true, name: true, pageId: true, status: true } },
          mediaAsset: { select: { id: true, filename: true, originalName: true, status: true, type: true } }
        }
      }
    }
  });

  if (!job) {
    throw new ValidationError("Publish job was not found.", "JOB_NOT_FOUND", 404);
  }

  return job;
}
