import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { regenerateQuestion, type AiQuizGenerationInput } from "@/lib/services/aiQuizGenerationService";

export async function POST(request: Request) {
  try {
    const body = await readJson<AiQuizGenerationInput & { questionIndex?: number }>(request);
    return json(await regenerateQuestion({ ...body, mode: body.mode ?? "quiz-builder", userId: requireProfessor(request).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
