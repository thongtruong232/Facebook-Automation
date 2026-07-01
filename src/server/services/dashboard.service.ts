import { startOfDay, endOfDay } from "../../lib/time";
import { prisma } from "../db";

export async function getDashboardSummary() {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    scheduledToday,
    publishedToday,
    failedToday,
    pendingJobs,
    runningJobs,
    totalPages,
    totalMedia,
    lastSuccessfulPublish,
    lastFailedPublish,
    upcomingPosts,
    recentFailedJobs
  ] = await Promise.all([
    prisma.socialPost.count({
      where: { scheduledAt: { gte: todayStart, lt: todayEnd }, status: { in: ["READY", "QUEUED", "PROCESSING"] } }
    }),
    prisma.socialPost.count({
      where: { publishedAt: { gte: todayStart, lt: todayEnd }, status: "PUBLISHED" }
    }),
    prisma.socialPost.count({
      where: { updatedAt: { gte: todayStart, lt: todayEnd }, status: "FAILED" }
    }),
    prisma.publishJob.count({ where: { status: "PENDING" } }),
    prisma.publishJob.count({ where: { status: "RUNNING" } }),
    prisma.facebookPage.count(),
    prisma.mediaAsset.count({ where: { status: { not: "DELETED" } } }),
    prisma.socialPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      include: { facebookPage: { select: { name: true } } }
    }),
    prisma.socialPost.findFirst({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      include: { facebookPage: { select: { name: true } } }
    }),
    prisma.socialPost.findMany({
      where: { status: { in: ["READY", "QUEUED"] }, scheduledAt: { gte: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { facebookPage: { select: { name: true } } }
    }),
    prisma.publishJob.findMany({
      where: { status: "FAILED" },
      orderBy: { finishedAt: "desc" },
      take: 5,
      include: { socialPost: { select: { id: true, caption: true, facebookPage: { select: { name: true } } } } }
    })
  ]);

  return {
    scheduledToday,
    publishedToday,
    failedToday,
    pendingJobs,
    runningJobs,
    totalPages,
    totalMedia,
    lastSuccessfulPublish,
    lastFailedPublish,
    upcomingPosts,
    recentFailedJobs
  };
}
