import { AttemptStatus, NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";
import { createNotifications, type CreateNotificationInput } from "@/lib/services/notificationService";
import { scoreAttempt, type AnswerInput } from "@/lib/services/scoring";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireStudent(request);
    const body = await readJson<{ answers?: AnswerInput[]; autoSubmitted?: boolean }>(request);
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: { quiz: { include: { questions: { include: { options: true } } } } }
    });

    if (attempt.studentId !== user.id) {
      throw new Error("You can only submit your own attempts.");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("This attempt has already been submitted.");
    }

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

    const feedback = await aiService.analyzeAttempt({
      attemptId: params.id,
      score: graded.score,
      percentage: graded.percentage,
      userId: user.id
    }) as {
      feedback?: string;
      strongTopics?: string[];
      weakTopics?: string[];
      nextSteps?: string[];
      practiceAction?: string;
    };
    const classmates = await prisma.quizAttempt.findMany({
      where: { quizId: attempt.quizId, status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] } },
      orderBy: [
        { percentage: "desc" },
        { submittedAt: "asc" }
      ]
    });
    const rank = classmates.findIndex((item) => item.id === params.id) + 1;
    const weakTopic = feedback.weakTopics?.[0];
    const notifications: CreateNotificationInput[] = [
      {
        userId: user.id,
        role: UserRole.STUDENT,
        context: "results",
        type: NotificationType.RESULT_AVAILABLE,
        title: "Quiz result available",
        message: `Your result for ${attempt.quiz.title} is now ready to review.`,
        actionUrl: `/quiz/${attempt.quiz.id}/results?attemptId=${params.id}`
      },
      {
        userId: user.id,
        role: UserRole.STUDENT,
        context: "leaderboard",
        type: NotificationType.LEADERBOARD_RANK_UPDATED,
        title: "Leaderboard rank updated",
        message: rank > 0 ? `You are now ranked #${rank} for ${attempt.quiz.title}.` : `Your latest score has updated the leaderboard for ${attempt.quiz.title}.`,
        actionUrl: "/student/leaderboards"
      },
      {
        userId: attempt.quiz.professorId,
        role: UserRole.PROFESSOR,
        context: "attempt",
        type: NotificationType.QUIZ_COMPLETED,
        title: "Student quiz completed",
        message: `${user.name} completed ${attempt.quiz.title} with ${Math.round(graded.percentage)}%.`,
        actionUrl: `/professor/reports?quizId=${attempt.quiz.id}`
      }
    ];

    if (weakTopic && graded.percentage < 70) {
      notifications.push({
        userId: user.id,
        role: UserRole.STUDENT,
        context: "practice",
        type: NotificationType.WEAK_TOPIC_PRACTICE_RECOMMENDED,
        title: "Practice recommended",
        message: `Spend a few minutes revising ${weakTopic} before your next quiz.`,
        actionUrl: `/student/practice?topic=${encodeURIComponent(weakTopic)}`
      });
    }

    if (graded.percentage >= 80) {
      notifications.push({
        userId: user.id,
        role: UserRole.STUDENT,
        context: "achievements",
        type: NotificationType.BADGE_UNLOCKED,
        title: "New badge unlocked",
        message: `You unlocked a high-score badge for ${attempt.quiz.title}.`,
        actionUrl: "/student/achievements"
      });
    }

    if (graded.percentage < 60) {
      notifications.push({
        userId: attempt.quiz.professorId,
        role: UserRole.PROFESSOR,
        context: "risk",
        type: NotificationType.STUDENT_PERFORMANCE_RISK,
        title: "Performance risk detected",
        message: `${user.name} scored ${Math.round(graded.percentage)}% on ${attempt.quiz.title} and may need follow-up support.`,
        actionUrl: "/professor/students"
      });
    }

    await createNotifications(notifications).catch((error) => {
      console.error("[quizly-notifications] failed to create submission notifications", error);
    });
    return json({ ...graded, passed: graded.score >= attempt.quiz.passingMarks, feedback });
  } catch (error) {
    return errorResponse(error);
  }
}
