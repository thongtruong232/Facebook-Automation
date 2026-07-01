import { z } from "zod";

const pageStatusSchema = z.enum(["ACTIVE", "DISABLED", "TOKEN_INVALID"]);

export const createFacebookPageSchema = z.object({
  pageId: z.string().trim().min(1, "Page ID is required."),
  name: z.string().trim().min(1, "Page name is required."),
  accessToken: z.string().trim().min(1, "Page Access Token is required."),
  dailyLimit: z.coerce.number().int().positive().max(200).default(30),
  timezone: z.string().trim().min(1).default("Asia/Ho_Chi_Minh"),
  status: pageStatusSchema.default("ACTIVE")
});

export const updateFacebookPageSchema = z
  .object({
    name: z.string().trim().min(1, "Page name is required.").optional(),
    accessToken: z.string().trim().min(1, "Page Access Token is required.").optional(),
    dailyLimit: z.coerce.number().int().positive().max(200).optional(),
    timezone: z.string().trim().min(1).optional(),
    status: pageStatusSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  });

export const createPageSchema = createFacebookPageSchema;

export type CreatePageInput = z.infer<typeof createFacebookPageSchema>;
export type UpdatePageInput = z.infer<typeof updateFacebookPageSchema>;
