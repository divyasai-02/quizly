import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ question?: string; answer?: string }>(request);
    return json(await aiService.generateExplanation({ ...body, userId: (await requireProfessor(request)).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
