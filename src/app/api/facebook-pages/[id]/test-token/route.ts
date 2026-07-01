import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { testPageToken } from "@/server/services/page.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return ok(await testPageToken(id));
  } catch (error) {
    return apiError(error);
  }
}
