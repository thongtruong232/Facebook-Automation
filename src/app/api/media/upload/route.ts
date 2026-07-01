import { apiError } from "@/server/api";
import { fail, ok } from "@/server/api-response";
import { createMediaFromUpload } from "@/server/services/media.service";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return fail("Missing upload file.", 400);
    }

    const media = await createMediaFromUpload(file);
    return ok(media, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
