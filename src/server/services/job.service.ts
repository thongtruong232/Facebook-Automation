import type { Prisma } from "@prisma/client";
import { AppError, getRetryDelayMs, sanitizeError, toErrorLike } from "../../lib/constants";
import { prisma } from "../db";
import { env } from "../env";

export async function createPublishJobForPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUniqueOrThrow({
    where: { id: postId },
    select: {
      id: true,
      scheduledAt: true,
      maxAttempts: true,
      status: true,
      facebookVideoId: true
    }
  });

  if (post.status === "PUBLISHED" || post.facebookVideoId) {
    throw new AppError("Post is already published or has a video ID.", {
      statusCode: 400,
      code: "IDEMPOTENCY_GUARD",
      retryable: false
    });
  }

  const activeJob = await prisma.publishJob.findFirst({
    where: {
      socialPostId: postId,
      status: { in: ["PENDING", "RUNNING"] }
    },
    select: { id: true }
  });

  if (activeJob) {
    return;
  }

  await prisma.publishJob.create({
    data: {
      socialPostId: postId,
      jobType: "PUBLISH_REEL",
      status: "PENDING",
      runAt: post.scheduledAt,
      maxAttempts: post.maxAttempts || env.MAX_RETRY
    }
  });
}

export async function getDueJobs(limit: number) {
  const now = new Date();
  const candidates = await prisma.publishJob.findMany({
    where: {
      status: "PENDING",
      runAt: { lte: now }
    },
    orderBy: { runAt: "asc" },
    take: Math.max(limit * 2, limit)
  });

  return candidates.filter((job) => job.attempts < job.maxAttempts).slice(0, limit);
}

export async function lockJob(jobId: string, workerId: string): Promise<boolean> {
  const result = await prisma.publishJob.updateMany({
    where: {
      id: jobId,
      status: "PENDING",
      lockedAt: null
    },
    data: {
      status: "RUNNING",
      lockedAt: new Date(),
      lockedBy: workerId,
      startedAt: new Date(),
      attempts: { increment: 1 }
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
      errorCode: null,
      errorMessage: null,
      rawResponseJson: sanitizeError(response) as Prisma.InputJsonValue
    }
  });
}

export async function markJobFailed(jobId: string, error: Error): Promise<void> {
  const errorLike = toErrorLike(error);
  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      finishedAt: new Date(),
      lockedAt: null,
      errorCode: errorLike.code ?? null,
      errorMessage: errorLike.message ?? "Unknown error.",
      rawResponseJson: sanitizeError(error) as Prisma.InputJsonValue
    }
  });
}

export async function markJobRetryableFailure(jobId: string, error: unknown): Promise<void> {
  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    select: { attempts: true }
  });
  const errorLike = toErrorLike(error);
  const delayMs = getRetryDelayMs(job.attempts, errorLike.retryAfterMs);

  await prisma.publishJob.update({
    where: { id: jobId },
    data: {
      status: "PENDING",
      runAt: new Date(Date.now() + delayMs),
      finishedAt: new Date(),
      lockedAt: null,
      errorCode: errorLike.code ?? null,
      errorMessage: errorLike.message ?? "Retryable error.",
      rawResponseJson: sanitizeError(error) as Prisma.InputJsonValue
    }
  });
}

export async function retryJob(jobId: string): Promise<void> {
  const job = await prisma.publishJob.findUniqueOrThrow({
    where: { id: jobId },
    include: { socialPost: { select: { status: true } } }
  });

  if (job.socialPost.status === "PUBLISHED") {
    throw new AppError("Published posts cannot be retried.", {
      statusCode: 400,
      code: "IDEMPOTENCY_GUARD",
      retryable: false
    });
  }

  await prisma.$transaction([
    prisma.publishJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        runAt: new Date(),
        attempts: 0,
        lockedAt: null,
        lockedBy: null,
        startedAt: null,
        finishedAt: null,
        errorCode: null,
        errorMessage: null
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

export async function retryLatestJobForPost(postId: string): Promise<void> {
  const job = await prisma.publishJob.findFirst({
    where: { socialPostId: postId },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });

  if (job) {
    await retryJob(job.id);
    return;
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
    select: { socialPostId: true }
  });

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
      startedAt: new Date()
    }
  });
}

export async function listJobs() {
  return prisma.publishJob.findMany({
    orderBy: { runAt: "desc" },
    take: 100,
    include: {
      socialPost: {
        select: {
          caption: true,
          status: true,
          facebookPage: { select: { name: true } }
        }
      }
    }
  });
}
