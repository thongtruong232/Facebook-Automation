import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { cancelPost } from "@/server/services/post.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await cancelPost(id);
    return ok({ cancelled: true });
  } catch (error) {
    return apiError(error);
  }
}
