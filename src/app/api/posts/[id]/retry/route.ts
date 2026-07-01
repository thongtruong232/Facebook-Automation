import { apiError, redirectTo } from "@/server/api";
import { retryLatestJobForPost } from "@/server/services/job.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await retryLatestJobForPost(id);
    return redirectTo(request, "/posts");
  } catch (error) {
    return apiError(error);
  }
}
