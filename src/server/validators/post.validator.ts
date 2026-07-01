import { z } from "zod";

const isoDateString = z.string().min(1).refine((value) => !Number.isNaN(new Date(value).getTime()), {
  message: "Scheduled date must be a valid date."
});

export const createPostSchema = z.object({
  facebookPageId: z.string().min(1, "Page is required."),
  mediaAssetId: z.string().min(1, "Media is required."),
  type: z.enum(["REEL", "VIDEO", "POST"]).default("REEL"),
  caption: z.string().trim().min(1, "Caption is required.").max(5000),
  scheduledAt: isoDateString,
  hashtags: z.string().trim().optional().default(""),
  internalNote: z.string().trim().optional().default(""),
  intent: z.enum(["draft", "schedule"]).optional().default("draft")
});

export const schedulePostSchema = z.object({
  scheduledAt: isoDateString
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
