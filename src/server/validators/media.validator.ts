import { z } from "zod";

export const allowedVideoMimeTypes = ["video/mp4", "video/quicktime", "video/webm"];

export const mediaUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  mimeType: z.string().refine((value) => allowedVideoMimeTypes.includes(value), {
    message: "Only mp4, mov, and webm videos are accepted."
  }),
  sizeBytes: z.number().int().positive().max(1024 * 1024 * 1024)
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;
