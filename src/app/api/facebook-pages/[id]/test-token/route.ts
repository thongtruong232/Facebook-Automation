import { apiError, redirectTo } from "@/server/api";
import { testPageToken } from "@/server/services/page.service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await testPageToken(id);
    return redirectTo(request, "/pages");
  } catch (error) {
    return apiError(error);
  }
}
