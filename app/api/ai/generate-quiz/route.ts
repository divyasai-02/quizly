import { errorResponse, json, readJson } from "@/lib/http";
import { assertRateLimit } from "@/lib/rateLimit";
import { requireProfessor } from "@/lib/serverSession";
import { generateQuizDraft, type AiQuizGenerationInput } from "@/lib/services/aiQuizGenerationService";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "ai.generateQuiz", limit: 20, windowMs: 60_000 });
    const body = await readJson<AiQuizGenerationInput>(request);
    return json(await generateQuizDraft({ ...body, mode: body.mode ?? "quiz-builder", userId: (await requireProfessor(request)).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
