import { apiError, readRequestInput } from "@/server/api";
import { ok } from "@/server/api-response";
import { disablePage, getPage, updatePage } from "@/server/services/page.service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await getPage(id));
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await updatePage(id, await readRequestInput(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return ok(await disablePage(id));
  } catch (error) {
    return apiError(error);
  }
}
