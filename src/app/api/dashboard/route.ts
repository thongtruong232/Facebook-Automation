import { apiError } from "@/server/api";
import { jsonResponse } from "@/server/http";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    return jsonResponse(await getDashboardSummary());
  } catch (error) {
    return apiError(error);
  }
}
