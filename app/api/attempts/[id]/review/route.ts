import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { summarizeAttemptLearning } from "@/lib/services/studentLearningService";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireStudent(request);
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        quiz: {
          include: {
            questions: {
              include: {
                options: { orderBy: { orderIndex: "asc" } }
              },
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        answers: {
          include: {
            selectedOptions: true
          }
        }
      }
    });

    if (attempt.studentId !== user.id) {
      throw new Error("You can only review your own attempts.");
    }

    const classmates = await prisma.quizAttempt.findMany({
      where: { quizId: attempt.quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { percentage: "desc" }
    });
    const classAverage = classmates.length ? Math.round(classmates.reduce((total, item) => total + item.percentage, 0) / classmates.length) : Math.round(attempt.percentage);
    const rank = classmates.findIndex((item) => item.id === attempt.id);
    const percentile = classmates.length ? Math.round(((classmates.length - Math.max(rank, 0)) / classmates.length) * 100) : Math.round(attempt.percentage);

    const historicalAttempts = await prisma.quizAttempt.findMany({
      where: { studentId: user.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      include: { quiz: true },
      orderBy: { createdAt: "asc" }
    });

    return json(summarizeAttemptLearning({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        timeTakenSeconds: attempt.timeTakenSeconds,
        status: attempt.status,
        createdAt: attempt.createdAt,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        quiz: {
          id: attempt.quiz.id,
          title: attempt.quiz.title,
          subject: attempt.quiz.subject,
          topic: attempt.quiz.topic,
          difficulty: attempt.quiz.difficulty,
          timeLimitMinutes: attempt.quiz.timeLimitMinutes,
          totalMarks: attempt.quiz.totalMarks,
          passingMarks: attempt.quiz.passingMarks,
          questions: attempt.quiz.questions.map((question) => ({
            id: question.id,
            text: question.text,
            topicTag: question.topicTag,
            difficulty: question.difficulty,
            explanation: question.explanation,
            marks: question.marks,
            sourceLabel: question.sourceLabel,
            options: question.options.map((option) => ({ id: option.id, text: option.text, isCorrect: option.isCorrect }))
          }))
        },
        answers: attempt.answers.map((answer) => ({
          questionId: answer.questionId,
          textAnswer: answer.textAnswer,
          isCorrect: answer.isCorrect,
          marksAwarded: answer.marksAwarded,
          markedForReview: answer.markedForReview,
          selectedOptionIds: answer.selectedOptions.map((item) => item.optionId)
        }))
      },
      classAverage,
      percentile,
      historicalAttempts: historicalAttempts.map((item) => ({
        id: item.id,
        quizId: item.quizId,
        title: item.quiz.title,
        subject: item.quiz.subject,
        topic: item.quiz.topic,
        difficulty: item.quiz.difficulty,
        percentage: item.percentage,
        score: item.score,
        passed: item.passed,
        status: item.status,
        timeTakenSeconds: item.timeTakenSeconds,
        suggestedTimeMinutes: item.quiz.timeLimitMinutes,
        createdAt: item.createdAt
      }))
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
