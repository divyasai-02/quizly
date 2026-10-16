import { errorResponse, json } from "@/lib/http";
import { getTemplateById } from "@/lib/templates";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const template = getTemplateById(params.id);
    if (!template) throw new Error("Template not found.");
    return json({ template });
  } catch (error) {
    return errorResponse(error);
  }
}
