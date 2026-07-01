import { apiError, readRequestInput } from "@/server/api";
import { ok } from "@/server/api-response";
import { createPage, listPages } from "@/server/services/page.service";

export async function GET() {
  try {
    return ok(await listPages());
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const page = await createPage(await readRequestInput(request));
    return ok(page, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
