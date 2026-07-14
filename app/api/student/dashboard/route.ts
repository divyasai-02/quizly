import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { calculateProgressBadges, summarizeAttemptLearning } from "@/lib/services/studentLearningService";
import { mapQuizSummary, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request) {
  try {
    const user = await requireStudent(request);
    const enrollments = await prisma.classroomStudent.findMany({
      where: { studentId: user.id },
      include: { classroom: { include: { professor: true } } }
    });
    const classroomIds = enrollments.map((item) => item.classroomId);
    const [quizzes, attempts] = await Promise.all([
      prisma.quiz.findMany({
        where: { classroomId: { in: classroomIds }, status: "PUBLISHED" },
        include: quizInclude,
        orderBy: { createdAt: "desc" }
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: user.id },
        include: { quiz: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const completedAttempts = attempts.filter((attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED");
    const progress = calculateProgressBadges(completedAttempts.map((attempt) => ({
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
    })));

    let latestLearning = null;
    const latestAttempt = completedAttempts[0];
    if (latestAttempt) {
      const detailed = await prisma.quizAttempt.findUnique({
        where: { id: latestAttempt.id },
        include: {
          quiz: {
            include: {
              questions: {
                include: { options: { orderBy: { orderIndex: "asc" } } },
                orderBy: { orderIndex: "asc" }
              }
            }
          },
          answers: { include: { selectedOptions: true } }
        }
      });
      if (detailed) {
        latestLearning = summarizeAttemptLearning({
          attempt: {
            id: detailed.id,
            score: detailed.score,
            percentage: detailed.percentage,
            passed: detailed.passed,
            timeTakenSeconds: detailed.timeTakenSeconds,
            status: detailed.status,
            createdAt: detailed.createdAt,
            quiz: {
              id: detailed.quiz.id,
              title: detailed.quiz.title,
              subject: detailed.quiz.subject,
              topic: detailed.quiz.topic,
              difficulty: detailed.quiz.difficulty,
              timeLimitMinutes: detailed.quiz.timeLimitMinutes,
              totalMarks: detailed.quiz.totalMarks,
              passingMarks: detailed.quiz.passingMarks,
              questions: detailed.quiz.questions.map((question) => ({
                id: question.id,
                text: question.text,
                topicTag: question.topicTag,
                difficulty: question.difficulty,
                explanation: question.explanation,
                marks: question.marks,
                options: question.options.map((option) => ({ id: option.id, text: option.text, isCorrect: option.isCorrect }))
              }))
            },
            answers: detailed.answers.map((answer) => ({
              questionId: answer.questionId,
              textAnswer: answer.textAnswer,
              isCorrect: answer.isCorrect,
              marksAwarded: answer.marksAwarded,
              markedForReview: answer.markedForReview,
              selectedOptionIds: answer.selectedOptions.map((item) => item.optionId)
            }))
          }
        });
      }
    }

    const averageAccuracy = completedAttempts.length
      ? Math.round(completedAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / completedAttempts.length)
      : 0;

    return json({
      studentName: user.name,
      activeQuizCount: quizzes.length,
      completedQuizCount: completedAttempts.length,
      xp: progress.xp,
      level: progress.level,
      averageAccuracy,
      weakTopics: latestLearning?.weakTopics.map((topic) => topic.topic) ?? [],
      aiSuggestion: latestLearning?.feedback.overall ?? "Complete a quiz to unlock your next recommended study step.",
      badges: progress.badges,
      latestLearning,
      latestQuizzes: quizzes.slice(0, 4).map(mapQuizSummary),
      classes: enrollments.map((item) => ({
        id: item.classroom.id,
        name: item.classroom.name,
        subject: item.classroom.subject,
        professor: item.classroom.professor.name
      })),
      completedHistory: completedAttempts.slice(0, 5).map((attempt) => ({
        id: attempt.id,
        quizId: attempt.quizId,
        title: attempt.quiz.title,
        percentage: Math.round(attempt.percentage),
        status: attempt.status,
        topic: attempt.quiz.topic
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
