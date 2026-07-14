import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { parseUploadedMaterial } from "@/lib/services/materialParsingService";

export async function POST(request: Request) {
  try {
    await requireProfessor(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Choose a file before uploading material.");
    }

    return json(await parseUploadedMaterial(file));
  } catch (error) {
    return errorResponse(error);
  }
}
