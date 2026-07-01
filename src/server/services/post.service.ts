import { MediaType, SocialPostStatus, SocialPostType } from "@prisma/client";
import { ValidationError } from "../errors";
import { prisma } from "../db";
import { env } from "../env";
import { createPostSchema, updatePostSchema } from "../validators/post.validator";

type ListPostFilters = {
  status?: SocialPostStatus;
  pageId?: string;
  limit?: number;
};

export async function listPosts(filters: ListPostFilters = {}) {
  return prisma.socialPost.findMany({
    orderBy: { scheduledAt: "desc" },
    take: filters.limit ?? 100,
    where: {
      status: filters.status,
      facebookPageId: filters.pageId
    },
    include: postInclude()
  });
}

export async function createPost(input: unknown) {
  const data = createPostSchema.parse(input);
  const shouldSchedule = data.intent === "schedule" || data.status === "READY";

  if (shouldSchedule && !data.scheduledAt) {
    throw new ValidationError("Scheduled date is required when scheduling a post.", "SCHEDULED_AT_REQUIRED");
  }

  await assertPageAndMediaReady(data.facebookPageId, data.mediaAssetId);

  const post = await prisma.socialPost.create({
    data: {
      facebookPageId: data.facebookPageId,
      mediaAssetId: data.mediaAssetId,
      type: data.type as SocialPostType,
      caption: data.caption,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
      status: "DRAFT",
      maxAttempts: env.MAX_RETRY,
      createdById: data.createdById
    },
    include: postInclude()
  });

  if (shouldSchedule) {
    await schedulePost(post.id, new Date(data.scheduledAt as string));
    return getPost(post.id);
  }

  return post;
}

export async function createDraftPost(input: unknown) {
  return createPost({
    ...((input && typeof input === "object") ? input : {}),
    status: "DRAFT",
    intent: "draft"
  });
}

export async function getPost(postId: string) {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    include: postInclude()
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  return post;
}

export async function updatePost(postId: string, input: unknown) {
  const data = updatePostSchema.parse(input);
  const existing = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { status: true, facebookVideoId: true }
  });

  if (!existing) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (existing.status === "PROCESSING" || existing.status === "PUBLISHED") {
    throw new ValidationError("Processing or published posts cannot be edited.", "POST_NOT_EDITABLE");
  }

  if (existing.facebookVideoId) {
    throw new ValidationError("Posts with a Facebook video ID cannot be edited.", "IDEMPOTENCY_GUARD");
  }

  if (data.facebookPageId || data.mediaAssetId) {
    const current = await prisma.socialPost.findUniqueOrThrow({
      where: { id: postId },
      select: { facebookPageId: true, mediaAssetId: true }
    });
    await assertPageAndMediaReady(
      data.facebookPageId ?? current.facebookPageId,
      data.mediaAssetId ?? current.mediaAssetId ?? undefined
    );
  }

  await prisma.socialPost.update({
    where: { id: postId },
    data: {
      facebookPageId: data.facebookPageId,
      mediaAssetId: data.mediaAssetId,
      type: data.type as SocialPostType | undefined,
      caption: data.caption,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status: data.status as SocialPostStatus | undefined,
      createdById: data.createdById
    }
  });

  if (data.status === "READY") {
    const updated = await prisma.socialPost.findUniqueOrThrow({ where: { id: postId }, select: { scheduledAt: true } });
    await schedulePost(postId, updated.scheduledAt);
  }

  return getPost(postId);
}

export async function schedulePost(postId: string, scheduledAt: Date) {
  const post = await prisma.socialPost.findUnique({
    where: { id: postId },
    select: { status: true, facebookVideoId: true, facebookPageId: true, mediaAssetId: true }
  });

  if (!post) {
    throw new ValidationError("Social post was not found.", "POST_NOT_FOUND", 404);
  }

  if (post.status === "PUBLISHED" || post.facebookVideoId) {
    throw new ValidationError("Published posts cannot be scheduled again.", "IDEMPOTENCY_GUARD");
  }

  await assertPageAndMediaReady(post.facebookPageId, post.mediaAssetId ?? undefined);

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
  return getPost(postId);
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

async function assertPageAndMediaReady(facebookPageId: string, mediaAssetId?: string) {
  const [page, media] = await Promise.all([
    prisma.facebookPage.findUnique({ where: { id: facebookPageId }, select: { status: true } }),
    mediaAssetId
      ? prisma.mediaAsset.findUnique({ where: { id: mediaAssetId }, select: { status: true, type: true } })
      : Promise.resolve(null)
  ]);

  if (!page) {
    throw new ValidationError("Facebook Page was not found.", "PAGE_NOT_FOUND", 404);
  }

  if (page.status !== "ACTIVE") {
    throw new ValidationError("Facebook Page must be ACTIVE before scheduling.", "PAGE_NOT_ACTIVE");
  }

  if (!media) {
    throw new ValidationError("Video media is required.", "MEDIA_REQUIRED");
  }

  if (media.status !== "READY" || media.type !== MediaType.VIDEO) {
    throw new ValidationError("Media must be a READY video asset.", "MEDIA_NOT_READY");
  }
}

function postInclude() {
  return {
    facebookPage: { select: { id: true, name: true, pageId: true, status: true } },
    mediaAsset: {
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        storagePath: true,
        status: true,
        type: true
      }
    },
    publishJobs: {
      orderBy: { createdAt: "desc" },
      take: 1,
      select: { id: true, status: true, attempts: true, maxAttempts: true, runAt: true }
    }
  } as const;
}
