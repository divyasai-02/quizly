import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireStudent(request);
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        answers: { include: { selectedOptions: true } },
        quiz: { include: quizInclude }
      }
    });

    if (attempt.studentId !== user.id) {
      throw new Error("You can only access your own attempts.");
    }

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
