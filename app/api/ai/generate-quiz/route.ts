import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ prompt?: string; topic?: string; count?: number }>(request);
    return json(await aiService.generateQuiz({ ...body, userId: requireProfessor(request).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
