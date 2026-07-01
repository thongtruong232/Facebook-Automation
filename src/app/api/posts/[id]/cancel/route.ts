import { apiError, redirectTo } from "@/server/api";
import { cancelPost } from "@/server/services/post.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await cancelPost(id);
    return redirectTo(request, "/posts");
  } catch (error) {
    return apiError(error);
  }
}
