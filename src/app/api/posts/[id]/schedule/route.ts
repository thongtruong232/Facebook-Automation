import { apiError, readRequestInput, redirectTo } from "@/server/api";
import { createPublishJobForPost } from "@/server/services/job.service";
import { schedulePost } from "@/server/services/post.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, input] = await Promise.all([params, readRequestInput(request)]);
    await schedulePost(id, new Date(input.scheduledAt));
    await createPublishJobForPost(id);
    return redirectTo(request, "/posts");
  } catch (error) {
    return apiError(error);
  }
}
