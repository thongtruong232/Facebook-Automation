import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MediaStatus, MediaType } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { ValidationError } from "../errors";
import { createMediaAssetSchema, mediaUploadSchema } from "../validators/media.validator";

export async function listMedia(filters: { status?: MediaStatus; type?: MediaType; limit?: number } = {}) {
  return prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: filters.limit ?? 100,
    where: {
      status: filters.status,
      type: filters.type
    }
  });
}

export async function getMediaAsset(id: string) {
  const media = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!media) {
    throw new ValidationError("Media asset was not found.", "MEDIA_NOT_FOUND", 404);
  }
  return media;
}

export async function createMediaAsset(input: unknown) {
  const data = createMediaAssetSchema.parse(input);
  return prisma.mediaAsset.create({
    data: {
      type: data.type as MediaType,
      filename: data.filename,
      originalName: data.originalName,
      storageDisk: data.storageDisk,
      storagePath: data.storagePath,
      publicUrl: data.publicUrl || null,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      durationSeconds: data.durationSeconds,
      status: data.status as MediaStatus
    }
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
  const safeOriginalName = slugify(path.basename(validation.fileName, extension));
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeOriginalName}${extension}`;
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

export async function deleteMediaAsset(id: string) {
  const postCount = await prisma.socialPost.count({ where: { mediaAssetId: id } });
  if (postCount === 0) {
    // TODO: Delete the physical file after adding storage-driver safe deletion.
    return prisma.mediaAsset.update({
      where: { id },
      data: { status: "DELETED" }
    });
  }

  return prisma.mediaAsset.update({
    where: { id },
    data: { status: "DELETED" }
  });
}

function extensionFromMime(mimeType: string): string {
  if (mimeType === "video/quicktime") return ".mov";
  if (mimeType === "video/webm") return ".webm";
  return ".mp4";
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "video";
}
