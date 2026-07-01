export type PublishReelInput = {
  pageId: string;
  pageName?: string;
  accessToken: string;
  filePath: string;
  caption: string;
};

export type PublishReelResult = {
  facebookVideoId: string;
  facebookPostId?: string;
  dryRun: boolean;
  rawResponse: Record<string, unknown>;
};

export type StartReelUploadResult = {
  videoId: string;
  uploadUrl: string;
};
