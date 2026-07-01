import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { deleteMediaAsset, getMediaAsset } from "@/server/services/media.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await getMediaAsset(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await deleteMediaAsset(id));
  } catch (error) {
    return apiError(error);
  }
}
