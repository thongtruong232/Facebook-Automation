import type { SocialPostStatus, SocialPostType } from "@prisma/client";

export type SocialPostListItem = {
  id: string;
  caption: string;
  type: SocialPostType;
  status: SocialPostStatus;
  scheduledAt: Date;
  publishedAt?: Date | null;
  attempts: number;
  pageName: string;
};
