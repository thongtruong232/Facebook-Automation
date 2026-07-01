import { apiError, readRequestInput, redirectTo } from "@/server/api";
import { jsonResponse } from "@/server/http";
import { createPage, listPages } from "@/server/services/page.service";

export async function GET() {
  try {
    return jsonResponse(await listPages());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await createPage(await readRequestInput(request));
    return redirectTo(request, "/pages");
  } catch (error) {
    return apiError(error);
  }
}
