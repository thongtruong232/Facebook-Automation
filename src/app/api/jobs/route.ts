import { apiError } from "@/server/api";
import { jsonResponse } from "@/server/http";
import { listJobs } from "@/server/services/job.service";

export async function GET() {
  try {
    return jsonResponse(await listJobs());
  } catch (error) {
    return apiError(error);
  }
}
