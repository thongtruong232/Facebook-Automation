import type { LogLevel, Prisma } from "@prisma/client";
import { sanitizeError } from "../../lib/constants";
import { prisma } from "../db";
import { logger } from "../logger";

type CreateJobLogInput = {
  jobId?: string;
  socialPostId?: string;
  level: LogLevel;
  step: string;
  message: string;
  meta?: unknown;
};

export async function createJobLog(input: CreateJobLogInput): Promise<void> {
  await prisma.jobLog.create({
    data: {
      jobId: input.jobId,
      socialPostId: input.socialPostId,
      level: input.level,
      step: input.step,
      message: input.message,
      metaJson: input.meta ? (sanitizeError(input.meta) as Prisma.InputJsonValue) : undefined
    }
  });
}

export async function logInfo(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.info({ step: input.step, message: input.message, meta: input.meta });
  await createJobLog({ ...input, level: "INFO" });
}

export async function logWarning(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.warning({ step: input.step, message: input.message, meta: input.meta });
  await createJobLog({ ...input, level: "WARNING" });
}

export async function logError(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.error({ step: input.step, message: input.message, meta: input.meta });
  await createJobLog({ ...input, level: "ERROR" });
}

export async function listLogs(limit = 100) {
  return prisma.jobLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      job: { select: { runId: true, status: true } },
      socialPost: { select: { caption: true, status: true } }
    }
  });
}
