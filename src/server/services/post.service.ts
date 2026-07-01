import { SocialPostStatus, SocialPostType } from "@prisma/client";
import { ValidationError } from "../errors";
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
      maxAttempts: env.MAX_RETRY
    }
  });
}

export async function schedulePost(postId: string, scheduledAt: Date): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { status: true, facebookVideoId: true }
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (post.status === "PUBLISHED" || post.facebookVideoId) {
    throw new ValidationError("Published posts cannot be scheduled again.", "IDEMPOTENCY_GUARD");
  }

  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      scheduledAt,
      status: SocialPostStatus.READY,
      lastError: null
    }
  });

  const { createPublishJobForPost } = await import("./job.service");
  await createPublishJobForPost(postId);
}

export async function cancelPost(postId: string): Promise<void> {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { status: true }
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (post.status === "PROCESSING" || post.status === "PUBLISHED") {
    throw new ValidationError("Processing or published posts cannot be cancelled.", "POST_NOT_CANCELABLE");
  }

  const { cancelPendingJobsForPost } = await import("./job.service");
  await cancelPendingJobsForPost(postId);

  await prisma.socialPost.update({
    where: { id: postId },
    data: { status: "CANCELLED" }
  });
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
