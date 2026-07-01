import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { retryLatestJobForPost } from "@/server/services/job.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await retryLatestJobForPost(id);
    return ok({ retried: true });
  } catch (error) {
    return apiError(error);
  }
}
