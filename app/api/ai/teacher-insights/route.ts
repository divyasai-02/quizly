import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ classroomId?: string; quizId?: string }>(request);
    return json(await aiService.generateTeacherInsights({ ...body, userId: requireProfessor(request).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
