import { apiError, redirectTo } from "@/server/api";
import { retryJob } from "@/server/services/job.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await retryJob(id);
    return redirectTo(request, "/jobs");
  } catch (error) {
    return apiError(error);
  }
}
