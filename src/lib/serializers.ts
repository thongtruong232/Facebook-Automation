import type { DashboardSummary, JobItem, LogItem, MediaItem, PageItem, PostItem } from "./admin-types";

export function serializePage(page: {
  id: string;
  pageId: string;
  name: string;
  status: string;
  dailyLimit: number;
  timezone: string;
  lastTokenCheckAt: Date | string | null;
  lastTokenError: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: { socialPosts: number };
}): PageItem {
  return {
    id: page.id,
    pageId: page.pageId,
    name: page.name,
    status: page.status,
    dailyLimit: page.dailyLimit,
    timezone: page.timezone,
    lastTokenCheckAt: toIso(page.lastTokenCheckAt),
    lastTokenError: page.lastTokenError,
    createdAt: toIso(page.createdAt) ?? "",
    updatedAt: toIso(page.updatedAt) ?? "",
    postCount: page._count?.socialPosts
  };
}

export function serializeMedia(item: {
  id: string;
  type: string;
  filename: string;
  originalName: string | null;
  storageDisk: string;
  storagePath: string;
  publicUrl: string | null;
  mimeType: string | null;
  sizeBytes: bigint | number | string | null;
  durationSeconds: number | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}): MediaItem {
  return {
    id: item.id,
    type: item.type,
    filename: item.filename,
    originalName: item.originalName,
    storageDisk: item.storageDisk,
    storagePath: item.storagePath,
    publicUrl: item.publicUrl,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes == null ? null : String(item.sizeBytes),
    durationSeconds: item.durationSeconds,
    status: item.status,
    createdAt: toIso(item.createdAt) ?? "",
    updatedAt: toIso(item.updatedAt) ?? ""
  };
}

export function serializePost(post: {
  id: string;
  caption: string;
  type: string;
  status: string;
  scheduledAt: Date | string;
  publishedAt: Date | string | null;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  facebookPage: PostItem["facebookPage"];
  mediaAsset: PostItem["mediaAsset"];
  publishJobs: Array<{
    id: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    runAt: Date | string;
  }>;
}): PostItem {
  return {
    id: post.id,
    caption: post.caption,
    type: post.type,
    status: post.status,
    scheduledAt: toIso(post.scheduledAt) ?? "",
    publishedAt: toIso(post.publishedAt),
    attempts: post.attempts,
    maxAttempts: post.maxAttempts,
    lastError: post.lastError,
    facebookPage: post.facebookPage,
    mediaAsset: post.mediaAsset,
    publishJobs: post.publishJobs.map((job) => ({
      ...job,
      runAt: toIso(job.runAt) ?? ""
    }))
  };
}

export function serializeJob(job: {
  id: string;
  runId: string;
  jobType: string;
  status: string;
  runAt: Date | string;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
  attempts: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: Date | string;
  socialPost: JobItem["socialPost"];
}): JobItem {
  return {
    id: job.id,
    runId: job.runId,
    jobType: job.jobType,
    status: job.status,
    runAt: toIso(job.runAt) ?? "",
    startedAt: toIso(job.startedAt),
    finishedAt: toIso(job.finishedAt),
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
    updatedAt: toIso(job.updatedAt) ?? "",
    socialPost: job.socialPost
  };
}

export function serializeLog(log: {
  id: string;
  jobId: string | null;
  socialPostId: string | null;
  level: string;
  step: string;
  message: string;
  metaJson: unknown;
  createdAt: Date | string;
  job: LogItem["job"];
  socialPost: LogItem["socialPost"];
}): LogItem {
  return {
    ...log,
    createdAt: toIso(log.createdAt) ?? ""
  };
}

export function serializeDashboard(data: {
  scheduledToday: number;
  publishedToday: number;
  failedToday: number;
  pendingJobs: number;
  runningJobs: number;
  totalPages: number;
  totalMedia: number;
  lastSuccessfulPublish: {
    publishedAt: Date | string | null;
    facebookPage: { name: string };
  } | null;
  lastFailedPublish: {
    lastError: string | null;
    facebookPage: { name: string };
  } | null;
  upcomingPosts: Array<{
    id: string;
    caption: string;
    scheduledAt: Date | string;
    status: string;
    facebookPage: { name: string };
  }>;
  recentFailedJobs: Array<{
    id: string;
    runId: string;
    errorMessage: string | null;
    attempts: number;
    maxAttempts: number;
    updatedAt: Date | string;
    socialPost: {
      id: string;
      caption: string;
      facebookPage: { name: string };
    };
  }>;
}): DashboardSummary {
  return {
    ...data,
    lastSuccessfulPublish: data.lastSuccessfulPublish
      ? {
          ...data.lastSuccessfulPublish,
          publishedAt: toIso(data.lastSuccessfulPublish.publishedAt)
        }
      : null,
    upcomingPosts: data.upcomingPosts.map((post) => ({
      ...post,
      scheduledAt: toIso(post.scheduledAt) ?? ""
    })),
    recentFailedJobs: data.recentFailedJobs.map((job) => ({
      ...job,
      updatedAt: toIso(job.updatedAt) ?? ""
    }))
  };
}

function toIso(value?: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}
