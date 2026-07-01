import { prisma } from "@/server/db";
import { jsonResponse } from "@/server/http";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return jsonResponse({ status: "healthy" });
  } catch {
    return jsonResponse({ status: "unhealthy" }, { status: 503 });
  }
}
