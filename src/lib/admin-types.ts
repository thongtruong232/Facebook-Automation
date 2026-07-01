export type PageItem = {
  id: string;
  pageId: string;
  name: string;
  status: string;
  dailyLimit: number;
  timezone: string;
  lastTokenCheckAt: string | null;
  lastTokenError: string | null;
  createdAt: string;
  updatedAt: string;
  postCount?: number;
};

export type MediaItem = {
  id: string;
  type: string;
  filename: string;
  originalName: string | null;
  storageDisk: string;
  storagePath: string;
  publicUrl: string | null;
  mimeType: string | null;
  sizeBytes: string | null;
  durationSeconds: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PostItem = {
  id: string;
  caption: string;
  type: string;
  status: string;
  scheduledAt: string;
  publishedAt: string | null;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  facebookPage: {
    id: string;
    name: string;
    pageId: string;
    status: string;
  };
  mediaAsset: {
    id: string;
    filename: string;
    originalName: string | null;
    mimeType: string | null;
    storagePath: string;
    status: string;
    type: string;
  } | null;
  publishJobs: Array<{
    id: string;
    status: string;
    attempts: number;
    maxAttempts: number;
    runAt: string;
  }>;
};

export type JobItem = {
  id: string;
  runId: string;
  jobType: string;
  status: string;
  runAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  attempts: number;
  maxAttempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: string;
  socialPost: {
    id: string;
    caption: string;
    status: string;
    mediaAsset: {
      filename: string;
      originalName: string | null;
    } | null;
    facebookPage: {
      name: string;
    };
  };
};

export type LogItem = {
  id: string;
  jobId: string | null;
  socialPostId: string | null;
  level: string;
  step: string;
  message: string;
  metaJson: unknown;
  createdAt: string;
  job: {
    runId: string;
    status: string;
  } | null;
  socialPost: {
    caption: string;
    status: string;
  } | null;
};

export type DashboardSummary = {
  scheduledToday: number;
  publishedToday: number;
  failedToday: number;
  pendingJobs: number;
  runningJobs: number;
  totalPages: number;
  totalMedia: number;
  lastSuccessfulPublish: {
    publishedAt: string | null;
    facebookPage: { name: string };
  } | null;
  lastFailedPublish: {
    lastError: string | null;
    facebookPage: { name: string };
  } | null;
  upcomingPosts: Array<{
    id: string;
    caption: string;
    scheduledAt: string;
    status: string;
    facebookPage: { name: string };
  }>;
  recentFailedJobs: Array<{
    id: string;
    runId: string;
    errorMessage: string | null;
    attempts: number;
    maxAttempts: number;
    updatedAt: string;
    socialPost: {
      id: string;
      caption: string;
      facebookPage: { name: string };
    };
  }>;
};
