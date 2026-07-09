import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { summarizeAttemptLearning } from "@/lib/services/studentLearningService";

export async function GET(request: Request) {
  try {
    const user = requireStudent(request);
    const latestAttempt = await prisma.quizAttempt.findFirst({
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
          include: {
            question: { include: { options: { orderBy: { orderIndex: "asc" } } } },
            selectedOptions: { include: { option: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!latestAttempt) {
      return json({
        aiSuggestion: "Complete your first quiz to unlock targeted study suggestions.",
        weakTopicCards: [],
        missedQuestions: [],
        latestAttemptId: null
      });
    }

    const learning = summarizeAttemptLearning({
      attempt: {
        id: latestAttempt.id,
        score: latestAttempt.score,
        percentage: latestAttempt.percentage,
        passed: latestAttempt.passed,
        timeTakenSeconds: latestAttempt.timeTakenSeconds,
        status: latestAttempt.status,
        createdAt: latestAttempt.createdAt,
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
      }
    });

    return json({
      aiSuggestion: learning.weakTopics.length
        ? `Based on your latest quiz, revise ${learning.weakTopics.map((topic) => topic.topic).slice(0, 2).join(" and ")} next.`
        : "Your latest quiz looked steady. Keep your edge with one short mixed practice loop.",
      weakTopicCards: learning.practiceRecommendations.map((item) => ({
        topic: item.topic,
        subject: item.subject,
        weakScore: learning.weakTopics.find((topic) => topic.topic === item.topic)?.weakScore ?? 0,
        recommendedQuestionCount: item.questionCount,
        difficulty: item.difficulty
      })),
      missedQuestions: learning.reviewQuestions
        .filter((question) => !question.isCorrect)
        .slice(0, 6)
        .map((question) => ({
          id: question.id,
          text: question.text,
          topic: question.topic,
          explanation: question.explanation,
          status: question.status
        })),
      latestAttemptId: latestAttempt.id
    });
  } catch (error) {
    return errorResponse(error);
  }
}
