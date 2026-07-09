import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { calculateProgressBadges, summarizeAttemptLearning } from "@/lib/services/studentLearningService";

export async function GET(request: Request) {
  try {
    const user = requireStudent(request);
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: user.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      include: {
        quiz: {
          include: {
            questions: {
              include: { options: { orderBy: { orderIndex: "asc" } } },
              orderBy: { orderIndex: "asc" }
            }
          }
        },
        answers: {
          include: { selectedOptions: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const attemptSummaries = attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      subject: attempt.quiz.subject,
      topic: attempt.quiz.topic,
      difficulty: attempt.quiz.difficulty,
      percentage: attempt.percentage,
      score: attempt.score,
      passed: attempt.passed,
      status: attempt.status,
      timeTakenSeconds: attempt.timeTakenSeconds,
      suggestedTimeMinutes: attempt.quiz.timeLimitMinutes,
      createdAt: attempt.createdAt
    }));
    const progress = calculateProgressBadges(attemptSummaries);
    const latestAttempt = attempts[0];

    let latestLearning = null;
    if (latestAttempt) {
      const classmates = await prisma.quizAttempt.findMany({
        where: { quizId: latestAttempt.quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
        orderBy: { percentage: "desc" }
      });
      const classAverage = classmates.length ? Math.round(classmates.reduce((total, item) => total + item.percentage, 0) / classmates.length) : Math.round(latestAttempt.percentage);
      const rank = classmates.findIndex((item) => item.id === latestAttempt.id);
      latestLearning = summarizeAttemptLearning({
        attempt: {
          id: latestAttempt.id,
          score: latestAttempt.score,
          percentage: latestAttempt.percentage,
          passed: latestAttempt.passed,
          timeTakenSeconds: latestAttempt.timeTakenSeconds,
          status: latestAttempt.status,
          createdAt: latestAttempt.createdAt,
          startedAt: latestAttempt.startedAt,
          submittedAt: latestAttempt.submittedAt,
          quiz: {
            id: latestAttempt.quiz.id,
            title: latestAttempt.quiz.title,
            subject: latestAttempt.quiz.subject,
            topic: latestAttempt.quiz.topic,
            difficulty: latestAttempt.quiz.difficulty,
            timeLimitMinutes: latestAttempt.quiz.timeLimitMinutes,
            totalMarks: latestAttempt.quiz.totalMarks,
            passingMarks: latestAttempt.quiz.passingMarks,
            questions: latestAttempt.quiz.questions.map((question) => ({
              id: question.id,
              text: question.text,
              topicTag: question.topicTag,
              difficulty: question.difficulty,
              explanation: question.explanation,
              marks: question.marks,
              options: question.options.map((option) => ({ id: option.id, text: option.text, isCorrect: option.isCorrect }))
            }))
          },
          answers: latestAttempt.answers.map((answer) => ({
            questionId: answer.questionId,
            textAnswer: answer.textAnswer,
            isCorrect: answer.isCorrect,
            marksAwarded: answer.marksAwarded,
            markedForReview: answer.markedForReview,
            selectedOptionIds: answer.selectedOptions.map((item) => item.optionId)
          }))
        },
        classAverage,
        percentile: classmates.length ? Math.round(((classmates.length - Math.max(rank, 0)) / classmates.length) * 100) : Math.round(latestAttempt.percentage),
        historicalAttempts: attemptSummaries
      });
    }

    return json({
      xp: progress.xp,
      level: progress.level,
      badges: progress.badges,
      latestLearning,
      latestAttemptId: latestAttempt?.id ?? null,
      attemptsCount: attemptSummaries.length
    });
  } catch (error) {
    return errorResponse(error);
  }
}
