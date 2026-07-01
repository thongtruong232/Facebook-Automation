import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MediaType } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { allowedVideoMimeTypes, mediaUploadSchema } from "../validators/media.validator";

export async function listMedia() {
  return prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

export async function createMediaFromUpload(file: File) {
  const validation = mediaUploadSchema.parse({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size
  });

  const uploadDir = path.resolve(env.UPLOAD_DIR);
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(validation.fileName) || extensionFromMime(validation.mimeType);
  const filename = `${randomUUID()}${extension}`;
  const storagePath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, bytes);

  return prisma.mediaAsset.create({
    data: {
      type: MediaType.VIDEO,
      filename,
      originalName: validation.fileName,
      storageDisk: env.STORAGE_DRIVER,
      storagePath,
      mimeType: validation.mimeType,
      sizeBytes: BigInt(validation.sizeBytes),
      status: "READY"
    }
  });
}

export function isSupportedVideoMimeType(mimeType?: string | null): boolean {
  return Boolean(mimeType && allowedVideoMimeTypes.includes(mimeType));
}

function extensionFromMime(mimeType: string): string {
  if (mimeType === "video/quicktime") return ".mov";
  if (mimeType === "video/webm") return ".webm";
  return ".mp4";
}
