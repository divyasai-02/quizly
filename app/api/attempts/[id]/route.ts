import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        answers: { include: { selectedOptions: true } },
        quiz: { include: quizInclude }
      }
    });
    return json({
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      quiz: mapQuizDetail(attempt.quiz),
      answers: attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptions.map((selection) => selection.optionId),
        textAnswer: answer.textAnswer,
        markedForReview: answer.markedForReview
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
