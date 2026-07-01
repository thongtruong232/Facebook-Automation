import { apiError, redirectTo } from "@/server/api";
import { createMediaFromUpload } from "@/server/services/media.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return new Response("Missing upload file.", { status: 400 });
    }

    await createMediaFromUpload(file);
    return redirectTo(request, "/media");
  } catch (error) {
    return apiError(error);
  }
}
