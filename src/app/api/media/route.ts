import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { listMedia } from "@/server/services/media.service";
import type { MediaStatus, MediaType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as MediaStatus | null;
    const type = searchParams.get("type") as MediaType | null;
    const limit = Number(searchParams.get("limit") ?? "100");
    return ok(
      await listMedia({
        status: status ?? undefined,
        type: type ?? undefined,
        limit: Number.isFinite(limit) ? limit : 100
      })
    );
  } catch (error) {
    return apiError(error);
  }
}
