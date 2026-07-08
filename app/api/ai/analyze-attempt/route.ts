import { errorResponse, json, readJson } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ attemptId?: string; score?: number; percentage?: number }>(request);
    return json(await aiService.analyzeAttempt({ ...body, userId: requireStudent(request).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
