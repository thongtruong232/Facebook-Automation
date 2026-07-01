import { apiError, readRequestInput, redirectTo } from "@/server/api";
import { jsonResponse } from "@/server/http";
import { createPublishJobForPost } from "@/server/services/job.service";
import { createDraftPost, listPosts, schedulePost } from "@/server/services/post.service";

export async function GET() {
  try {
    return jsonResponse(await listPosts());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = await readRequestInput(request);
    const scheduledAt = new Date(input.scheduledAt);
    const post = await createDraftPost({
      ...input,
      scheduledAt: scheduledAt.toISOString(),
      intent: input.intent === "schedule" ? "schedule" : "draft"
    });

    if (input.intent === "schedule") {
      await schedulePost(post.id, scheduledAt);
      await createPublishJobForPost(post.id);
    }

    return redirectTo(request, "/posts");
  } catch (error) {
    return apiError(error);
  }
}
