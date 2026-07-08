import { AttemptStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { scoreAttempt, type AnswerInput } from "@/lib/services/scoring";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await readJson<{ answers?: AnswerInput[]; autoSubmitted?: boolean }>(request);
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: { quiz: { include: { questions: { include: { options: true } } } } }
    });
    if (attempt.status !== "IN_PROGRESS") throw new Error("This attempt has already been submitted.");

    const graded = scoreAttempt(attempt.quiz.questions, body.answers ?? []);

    await prisma.$transaction(async (tx) => {
      for (const answer of graded.graded) {
        const saved = await tx.attemptAnswer.upsert({
          where: { attemptId_questionId: { attemptId: params.id, questionId: answer.questionId } },
          update: {
            textAnswer: answer.textAnswer,
            isCorrect: answer.isCorrect,
            marksAwarded: answer.marksAwarded,
            markedForReview: answer.markedForReview,
            answeredAt: new Date()
          },
          create: {
            attemptId: params.id,
            questionId: answer.questionId,
            textAnswer: answer.textAnswer,
            isCorrect: answer.isCorrect,
            marksAwarded: answer.marksAwarded,
            markedForReview: answer.markedForReview,
            answeredAt: new Date()
          }
        });
        await tx.attemptSelectedOption.deleteMany({ where: { attemptAnswerId: saved.id } });
        if (answer.selectedOptionIds.length) {
          await tx.attemptSelectedOption.createMany({
            data: answer.selectedOptionIds.map((optionId) => ({ attemptAnswerId: saved.id, optionId }))
          });
        }
      }
      await tx.quizAttempt.update({
        where: { id: params.id },
        data: {
          status: body.autoSubmitted ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          timeTakenSeconds: Math.max(0, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)),
          score: graded.score,
          percentage: graded.percentage,
          passed: graded.score >= attempt.quiz.passingMarks
        }
      });
    });

    const feedback = await aiService.analyzeAttempt({ attemptId: params.id, score: graded.score, percentage: graded.percentage, userId: attempt.studentId });
    return json({ ...graded, passed: graded.score >= attempt.quiz.passingMarks, feedback });
  } catch (error) {
    return errorResponse(error);
  }
}
