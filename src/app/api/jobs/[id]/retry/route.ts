import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { getPublishJob, retryJob } from "@/server/services/job.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await retryJob(id);
    return ok(await getPublishJob(id));
  } catch (error) {
    return apiError(error);
  }
}
