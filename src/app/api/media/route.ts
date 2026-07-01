import { apiError } from "@/server/api";
import { jsonResponse } from "@/server/http";
import { listMedia } from "@/server/services/media.service";

export async function GET() {
  try {
    return jsonResponse(await listMedia());
  } catch (error) {
    return apiError(error);
  }
}
