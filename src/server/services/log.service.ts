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
  metaJson?: unknown;
};

export async function createJobLog(input: CreateJobLogInput): Promise<void> {
  if (!input.jobId && !input.socialPostId) return;

  try {
    await prisma.jobLog.create({
      data: {
        jobId: input.jobId,
        socialPostId: input.socialPostId,
        level: input.level,
        step: input.step,
        message: input.message,
        metaJson: input.metaJson ? (sanitizeError(input.metaJson) as Prisma.InputJsonValue) : undefined
      }
    });
  } catch (error) {
    logger.warn("Failed to persist job log.", {
      step: "job_log_persist_failed",
      error: sanitizeError(error),
      jobId: input.jobId,
      socialPostId: input.socialPostId
    });
  }
}

export async function logInfo(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.info(input.message, { step: input.step, meta: input.metaJson });
  await createJobLog({ ...input, level: "INFO" });
}

export async function logWarning(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.warn(input.message, { step: input.step, meta: input.metaJson });
  await createJobLog({ ...input, level: "WARNING" });
}

export async function logError(input: Omit<CreateJobLogInput, "level">): Promise<void> {
  logger.error(input.message, { step: input.step, meta: input.metaJson });
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
