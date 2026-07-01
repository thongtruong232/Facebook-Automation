import { z } from "zod";

export const allowedVideoMimeTypes = ["video/mp4", "video/quicktime", "video/webm", "application/octet-stream"];

export const mediaUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().refine((value) => allowedVideoMimeTypes.includes(value), {
    message: "Only mp4, mov, webm, and octet-stream test videos are accepted."
  }),
  sizeBytes: z.number().int().positive().max(1024 * 1024 * 1024)
});

export const createMediaAssetSchema = z.object({
  type: z.enum(["VIDEO", "IMAGE"]).default("VIDEO"),
  filename: z.string().trim().min(1),
  originalName: z.string().trim().optional(),
  storageDisk: z.string().trim().min(1).default("local"),
  storagePath: z.string().trim().min(1),
  publicUrl: z.string().trim().url().optional().or(z.literal("")),
  mimeType: z.string().trim().optional(),
  sizeBytes: z.coerce.bigint().optional(),
  durationSeconds: z.coerce.number().int().positive().optional(),
  status: z.enum(["READY", "PROCESSING", "FAILED", "DELETED"]).default("READY")
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
export type CreateMediaAssetInput = z.infer<typeof createMediaAssetSchema>;
