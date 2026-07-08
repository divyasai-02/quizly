import { errorResponse, json } from "@/lib/http";
import { getTemplateById } from "@/lib/templates";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const template = getTemplateById(params.id);
    if (!template) throw new Error("Template not found.");
    return json({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
