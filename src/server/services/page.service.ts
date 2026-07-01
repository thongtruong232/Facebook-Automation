import { PageStatus } from "@prisma/client";
import { decryptSecret, encryptSecret, maskToken } from "../../lib/crypto";
import { prisma } from "../db";
import { env } from "../env";
import { createPageSchema } from "../validators/page.validator";
import { metaService } from "./meta.service";

export async function listPages() {
  const pages = await prisma.facebookPage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pageId: true,
      name: true,
      tokenStatus: true,
      status: true,
      dailyLimit: true,
      timezone: true,
      lastTokenCheckAt: true,
      lastError: true,
      createdAt: true,
      accessTokenEncrypted: true,
      _count: { select: { posts: true } }
    }
  });

  return pages.map((page) => ({
    ...page,
    accessTokenEncrypted: undefined,
    maskedToken: safeMaskEncryptedToken(page.accessTokenEncrypted)
  }));
}

export async function createPage(input: unknown) {
  const data = createPageSchema.parse(input);
  const accessTokenEncrypted = encryptSecret(data.accessToken, env.TOKEN_ENCRYPTION_KEY);

  return prisma.facebookPage.create({
    data: {
      pageId: data.pageId,
      name: data.name,
      accessTokenEncrypted,
      dailyLimit: data.dailyLimit,
      timezone: data.timezone,
      status: data.status as PageStatus
    },
    select: {
      id: true,
      pageId: true,
      name: true,
      tokenStatus: true,
      status: true,
      dailyLimit: true,
      timezone: true,
      createdAt: true
    }
  });
}

export async function testPageToken(id: string): Promise<boolean> {
  const page = await prisma.facebookPage.findUniqueOrThrow({ where: { id } });
  const token = decryptSecret(page.accessTokenEncrypted, env.TOKEN_ENCRYPTION_KEY);
  const valid = await metaService.testPageToken(page.pageId, token);

  await prisma.facebookPage.update({
    where: { id },
    data: {
      tokenStatus: valid ? "valid" : "invalid",
      lastTokenCheckAt: new Date(),
      lastError: valid ? null : "Token validation failed."
    }
  });

  return valid;
}

function safeMaskEncryptedToken(accessTokenEncrypted: string): string {
  try {
    return maskToken(decryptSecret(accessTokenEncrypted, env.TOKEN_ENCRYPTION_KEY));
  } catch {
    return "encrypted";
  }
}
