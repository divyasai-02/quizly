import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { generateRemedialQuiz, type AiQuizGenerationInput } from "@/lib/services/aiQuizGenerationService";

export async function POST(request: Request) {
  try {
    const body = await readJson<AiQuizGenerationInput>(request);
    return json(await generateRemedialQuiz({ ...body, mode: "analytics-remedial", userId: requireProfessor(request).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
