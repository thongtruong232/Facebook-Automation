import { z } from "zod";

export const createPageSchema = z.object({
  pageId: z.string().trim().min(1, "Page ID is required."),
  name: z.string().trim().min(1, "Page name is required."),
  accessToken: z.string().trim().min(1, "Page Access Token is required."),
  dailyLimit: z.coerce.number().int().positive().max(200).default(30),
  timezone: z.string().trim().min(1).default("Asia/Ho_Chi_Minh"),
  status: z.enum(["ACTIVE", "DISABLED"]).default("ACTIVE")
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
