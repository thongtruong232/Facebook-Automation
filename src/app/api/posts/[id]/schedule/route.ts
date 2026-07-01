import { apiError, readRequestInput } from "@/server/api";
import { ok } from "@/server/api-response";
import { schedulePost } from "@/server/services/post.service";
import { schedulePostSchema } from "@/server/validators/post.validator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, input] = await Promise.all([params, readRequestInput(request)]);
    const data = schedulePostSchema.parse(input);
    return ok(await schedulePost(id, new Date(data.scheduledAt)));
  } catch (error) {
    return apiError(error);
  }
}
