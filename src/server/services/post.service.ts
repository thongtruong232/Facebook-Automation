import { SocialPostStatus, SocialPostType } from "@prisma/client";
import { AppError } from "../../lib/constants";
import { prisma } from "../db";
import { env } from "../env";
import { createPostSchema } from "../validators/post.validator";

export async function listPosts() {
  return prisma.socialPost.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 100,
    include: {
      facebookPage: { select: { name: true, pageId: true } },
      mediaAsset: { select: { filename: true, mimeType: true, storagePath: true } },
      publishJobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, attempts: true, maxAttempts: true }
      }
    }
  });
}

export async function createDraftPost(input: unknown) {
  const data = createPostSchema.parse(input);

  return prisma.socialPost.create({
    data: {
      facebookPageId: data.facebookPageId,
      mediaAssetId: data.mediaAssetId,
      type: data.type as SocialPostType,
      caption: data.caption,
      scheduledAt: new Date(data.scheduledAt),
      status: "DRAFT",
      hashtags: data.hashtags,
      internalNote: data.internalNote,
      maxAttempts: env.MAX_RETRY
    }
  });
}

export async function schedulePost(postId: string, scheduledAt: Date): Promise<void> {
  const post = await prisma.socialPost.findUniqueOrThrow({
    where: { id: postId },
    select: { status: true, facebookVideoId: true }
  });

  if (post.status === "PUBLISHED" || post.facebookVideoId) {
    throw new AppError("Published posts cannot be scheduled again.", {
      statusCode: 400,
      code: "IDEMPOTENCY_GUARD",
      retryable: false
    });
  }

  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      scheduledAt,
      status: SocialPostStatus.QUEUED,
      lastError: null
    }
  });
}

export async function cancelPost(postId: string): Promise<void> {
  await prisma.$transaction([
    prisma.publishJob.updateMany({
      where: {
        socialPostId: postId,
        status: { in: ["PENDING", "RUNNING"] }
      },
      data: {
        status: "CANCELLED",
        finishedAt: new Date(),
        lockedAt: null
      }
    }),
    prisma.socialPost.update({
      where: { id: postId },
      data: { status: "CANCELLED" }
    })
  ]);
}

export async function markPostProcessing(postId: string): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      lastError: null
    }
  });
}

export async function markPostPublished(
  postId: string,
  facebookVideoId: string,
  facebookPostId?: string
): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "PUBLISHED",
      facebookVideoId,
      facebookPostId,
      publishedAt: new Date(),
      lastError: null
    }
  });
}

export async function markPostDryRunChecked(postId: string): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "READY",
      dryRunCheckedAt: new Date(),
      lastError: null
    }
  });
}

export async function markPostQueued(postId: string, error?: string): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "QUEUED",
      lastError: error ?? null
    }
  });
}

export async function markPostFailed(postId: string, error: string): Promise<void> {
  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      status: "FAILED",
      lastError: error
    }
  });
}

export async function countPublishedTodayForPage(pageId: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.socialPost.count({
    where: {
      facebookPageId: pageId,
      status: "PUBLISHED",
      publishedAt: {
        gte: start,
        lt: end
      }
    }
  });
}

export async function getPostForPublish(postId: string) {
  return prisma.socialPost.findUnique({
    where: { id: postId },
    include: {
      facebookPage: true,
      mediaAsset: true
    }
  });
}
