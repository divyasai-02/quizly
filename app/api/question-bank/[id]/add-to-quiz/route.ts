import { errorResponse, json, readJson } from "@/lib/http";
import { addQuestionBankItemToQuiz } from "@/lib/questionBank";
import { requireProfessor } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const body = await readJson<{ quizId?: string }>(request);
    if (!body.quizId) throw new Error("A draft quiz must be selected.");
    const question = await addQuestionBankItemToQuiz(params.id, body.quizId, user.id);
    return json({ ok: true, questionId: question.id });
  } catch (error) {
    return errorResponse(error);
  }
}
