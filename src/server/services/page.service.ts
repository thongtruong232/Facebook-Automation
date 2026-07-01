import { PageStatus } from "@prisma/client";
import { decryptSecret, encryptSecret } from "../../lib/crypto";
import { prisma } from "../db";
import { env } from "../env";
import { ValidationError, getErrorMessage } from "../errors";
import { createFacebookPageSchema, updateFacebookPageSchema } from "../validators/page.validator";
import { metaService } from "./meta.service";

export async function listPages() {
  return prisma.facebookPage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      pageId: true,
      name: true,
      status: true,
      dailyLimit: true,
      timezone: true,
      lastTokenCheckAt: true,
      lastTokenError: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { socialPosts: true } }
    }
  });
}

export async function createPage(input: unknown) {
  const data = createFacebookPageSchema.parse(input);
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
      status: true,
      dailyLimit: true,
      timezone: true,
      lastTokenCheckAt: true,
      lastTokenError: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function getPage(id: string) {
  const page = await prisma.facebookPage.findUnique({
    where: { id },
    select: safePageSelect()
  });

  if (!page) {
    throw new ValidationError("Facebook Page was not found.", "PAGE_NOT_FOUND", 404);
  }

  return page;
}

export async function updatePage(id: string, input: unknown) {
  const data = updateFacebookPageSchema.parse(input);
  const accessTokenEncrypted = data.accessToken
    ? encryptSecret(data.accessToken, env.TOKEN_ENCRYPTION_KEY)
    : undefined;

  return prisma.facebookPage.update({
    where: { id },
    data: {
      name: data.name,
      dailyLimit: data.dailyLimit,
      timezone: data.timezone,
      status: data.status as PageStatus | undefined,
      accessTokenEncrypted
    },
    select: safePageSelect()
  });
}

export async function disablePage(id: string) {
  return prisma.facebookPage.update({
    where: { id },
    data: { status: "DISABLED" },
    select: safePageSelect()
  });
}

export async function testPageToken(id: string) {
  const page = await prisma.facebookPage.findUnique({ where: { id } });
  if (!page) {
    throw new ValidationError("Facebook Page was not found.", "PAGE_NOT_FOUND", 404);
  }

  try {
    const token = decryptSecret(page.accessTokenEncrypted, env.TOKEN_ENCRYPTION_KEY);
    const valid = await metaService.testPageToken(page.pageId, token);

    const updatedPage = await prisma.facebookPage.update({
      where: { id },
      data: {
        status: valid ? "ACTIVE" : "TOKEN_INVALID",
        lastTokenCheckAt: new Date(),
        lastTokenError: valid ? null : "Token validation failed."
      },
      select: safePageSelect()
    });

    return { valid, page: updatedPage };
  } catch (error) {
    const updatedPage = await prisma.facebookPage.update({
      where: { id },
      data: {
        status: "TOKEN_INVALID",
        lastTokenCheckAt: new Date(),
        lastTokenError: getErrorMessage(error)
      },
      select: safePageSelect()
    });

    return { valid: false, page: updatedPage, error: getErrorMessage(error) };
  }
}

function safePageSelect() {
  return {
    id: true,
    pageId: true,
    name: true,
    status: true,
    dailyLimit: true,
    timezone: true,
    lastTokenCheckAt: true,
    lastTokenError: true,
    createdAt: true,
    updatedAt: true
  } as const;
}
