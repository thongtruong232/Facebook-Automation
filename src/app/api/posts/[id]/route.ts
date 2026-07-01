import { apiError, readRequestInput } from "@/server/api";
import { ok } from "@/server/api-response";
import { cancelPost, getPost, updatePost } from "@/server/services/post.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await getPost(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await updatePost(id, await readRequestInput(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    await cancelPost(id);
    return ok({ cancelled: true });
  } catch (error) {
    return apiError(error);
  }
}
