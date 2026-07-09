import { errorResponse, json, readJson } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { scorePracticeSubmission, type PracticeQuestion } from "@/lib/services/studentLearningService";

export async function POST(request: Request) {
  try {
    requireStudent(request);
    const body = await readJson<{
      questions?: PracticeQuestion[];
      answers?: Array<{ questionId: string; selectedOptionIds?: string[] }>;
    }>(request);
    return json(scorePracticeSubmission(body.questions ?? [], body.answers ?? []));
  } catch (error) {
    return errorResponse(error);
  }
}
