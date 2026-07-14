import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";

type AnswerPayload = {
  markedForReview?: boolean;
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
};

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireStudent(request);
    const body = await readJson<{ answers?: AnswerPayload[]; answer?: AnswerPayload }>(request);
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: params.id } });

    if (attempt.studentId !== user.id) {
      throw new Error("You can only update your own attempts.");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("Submitted attempts cannot be edited.");
    }

    const answers = body.answers ?? (body.answer ? [body.answer] : []);

    for (const answer of answers) {
      const saved = await prisma.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: params.id, questionId: answer.questionId } },
        update: {
          textAnswer: answer.textAnswer,
          markedForReview: answer.markedForReview ?? false,
          answeredAt: new Date()
        },
        create: {
          attemptId: params.id,
          questionId: answer.questionId,
          textAnswer: answer.textAnswer,
          markedForReview: answer.markedForReview ?? false,
          answeredAt: new Date()
        }
      });

      await prisma.attemptSelectedOption.deleteMany({ where: { attemptAnswerId: saved.id } });
      if (answer.selectedOptionIds?.length) {
        await prisma.attemptSelectedOption.createMany({
          data: answer.selectedOptionIds.map((optionId) => ({ attemptAnswerId: saved.id, optionId }))
        });
      }
    }

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
