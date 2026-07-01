import type { SocialPostStatus } from "@prisma/client";
import { apiError, readRequestInput } from "@/server/api";
import { ok } from "@/server/api-response";
import { createPost, listPosts } from "@/server/services/post.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as SocialPostStatus | null;
    const limit = Number(searchParams.get("limit") ?? "100");
    return ok(
      await listPosts({
        status: status ?? undefined,
        pageId: searchParams.get("pageId") ?? undefined,
        limit: Number.isFinite(limit) ? limit : 100
      })
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    return ok(await createPost(await readRequestInput(request)), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
