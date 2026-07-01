import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/server/db";
import { env } from "../src/server/env";
import { encryptSecret } from "../src/lib/crypto";

const seedCaption = "Dry-run test reel";

async function main() {
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  const samplePath = path.join(uploadDir, "sample.mp4");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(samplePath, "fake mp4 content for dry-run worker test", { flag: "w" });

  await db.jobLog.deleteMany({
    where: {
      socialPost: {
        caption: seedCaption
      }
    }
  });
  await db.publishJob.deleteMany({
    where: {
      socialPost: {
        caption: seedCaption
      }
    }
  });
  await db.socialPost.deleteMany({
    where: {
      caption: seedCaption
    }
  });

  const user = await db.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      role: "ADMIN",
      status: "ACTIVE"
    },
    create: {
      email: "admin@example.com",
      passwordHash: "seed-password-hash",
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  const page = await db.facebookPage.upsert({
    where: { pageId: "test_page_001" },
    update: {
      name: "Test Page",
      accessTokenEncrypted: encryptSecret("test_access_token", env.TOKEN_ENCRYPTION_KEY),
      status: "ACTIVE",
      lastTokenError: null
    },
    create: {
      pageId: "test_page_001",
      name: "Test Page",
      accessTokenEncrypted: encryptSecret("test_access_token", env.TOKEN_ENCRYPTION_KEY),
      status: "ACTIVE",
      dailyLimit: 30,
      timezone: env.DEFAULT_TIMEZONE
    }
  });

  const existingMedia = await db.mediaAsset.findFirst({
    where: { storagePath: samplePath }
  });
  const media =
    existingMedia ??
    (await db.mediaAsset.create({
      data: {
        type: "VIDEO",
        filename: "sample.mp4",
        originalName: "sample.mp4",
        storageDisk: "local",
        storagePath: samplePath,
        mimeType: "video/mp4",
        sizeBytes: BigInt(37),
        status: "READY"
      }
    }));

  const scheduledAt = new Date(Date.now() - 60_000);
  const post = await db.socialPost.create({
    data: {
      facebookPageId: page.id,
      mediaAssetId: media.id,
      type: "REEL",
      caption: seedCaption,
      scheduledAt,
      status: "READY",
      maxAttempts: env.MAX_RETRY,
      createdById: user.id
    }
  });

  const job = await db.publishJob.create({
    data: {
      socialPostId: post.id,
      jobType: "PUBLISH_REEL",
      status: "PENDING",
      runAt: scheduledAt,
      maxAttempts: env.MAX_RETRY
    }
  });

  console.log(
    JSON.stringify({
      seeded: true,
      userId: user.id,
      pageId: page.id,
      mediaId: media.id,
      postId: post.id,
      jobId: job.id,
      samplePath
    })
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
