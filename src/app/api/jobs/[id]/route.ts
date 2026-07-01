import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { getPublishJob } from "@/server/services/job.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await getPublishJob(id));
  } catch (error) {
    return apiError(error);
  }
}
