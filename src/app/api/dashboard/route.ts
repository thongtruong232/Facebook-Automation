import { apiError } from "@/server/api";
import { ok } from "@/server/api-response";
import { getDashboardSummary } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    return ok(await getDashboardSummary());
  } catch (error) {
    return apiError(error);
  }
}
