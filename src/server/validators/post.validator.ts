import { z } from "zod";

const isoDateString = z.string().min(1).refine((value) => !Number.isNaN(new Date(value).getTime()), {
  message: "Scheduled date must be a valid date."
});

const socialPostStatusSchema = z.enum(["DRAFT", "READY", "QUEUED", "PROCESSING", "PUBLISHED", "FAILED", "CANCELLED"]);
const socialPostTypeSchema = z.enum(["REEL", "VIDEO", "POST"]);

export const createPostSchema = z.object({
  facebookPageId: z.string().min(1, "Page is required."),
  mediaAssetId: z.string().min(1, "Media is required."),
  type: socialPostTypeSchema.default("REEL"),
  caption: z.string().trim().min(1, "Caption is required.").max(5000),
  scheduledAt: isoDateString.optional(),
  status: socialPostStatusSchema.default("DRAFT"),
  createdById: z.string().min(1).optional(),
  hashtags: z.string().trim().optional().default(""),
  internalNote: z.string().trim().optional().default(""),
  intent: z.enum(["draft", "schedule"]).optional().default("draft")
});

export const schedulePostSchema = z.object({
  scheduledAt: isoDateString
});

export const updatePostSchema = z
  .object({
    facebookPageId: z.string().min(1, "Page is required.").optional(),
    mediaAssetId: z.string().min(1, "Media is required.").optional(),
    type: socialPostTypeSchema.optional(),
    caption: z.string().trim().min(1, "Caption is required.").max(5000).optional(),
    scheduledAt: isoDateString.optional(),
    status: socialPostStatusSchema.optional(),
    createdById: z.string().min(1).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
