import type { PublishJobStatus } from "@prisma/client";
import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { listPublishJobs } from "@/server/services/job.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PublishJobStatus | null;
    const limit = Number(searchParams.get("limit") ?? "100");
    return ok(
      await listPublishJobs({
        status: status ?? undefined,
        limit: Number.isFinite(limit) ? limit : 100
      })
    );
  } catch (error) {
    return apiError(error);
  }
}
