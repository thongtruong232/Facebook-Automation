export type PublishReelInput = {
  pageId: string;
  accessToken: string;
  videoPath: string;
  caption: string;
  dryRun?: boolean;
};

export type PublishReelResult = {
  facebookVideoId: string;
  facebookPostId?: string;
  rawResponse: Record<string, unknown>;
};

export type StartReelUploadResult = {
  videoId: string;
  uploadUrl: string;
};
