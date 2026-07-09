import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { summarizeAttemptLearning } from "@/lib/services/studentLearningService";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        answers: {
          include: {
            question: { include: { options: { orderBy: { orderIndex: "asc" } } } },
            selectedOptions: { include: { option: true } }
          }
        },
        quiz: {
          include: {
            questions: {
              include: { options: { orderBy: { orderIndex: "asc" } } },
              orderBy: { orderIndex: "asc" }
            }
          }
        }
      }
    });
    const classmates = await prisma.quizAttempt.findMany({
      where: { quizId: attempt.quizId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      orderBy: { percentage: "desc" }
    });
    const rank = classmates.findIndex((item) => item.id === attempt.id);
    const learning = summarizeAttemptLearning({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        timeTakenSeconds: attempt.timeTakenSeconds,
        status: attempt.status,
        createdAt: attempt.createdAt,
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
      classAverage: classmates.length ? Math.round(classmates.reduce((total, item) => total + item.percentage, 0) / classmates.length) : Math.round(attempt.percentage),
      percentile: classmates.length ? Math.round(((classmates.length - Math.max(rank, 0)) / classmates.length) * 100) : Math.round(attempt.percentage)
    });

    return json({
      ...learning,
      id: attempt.id,
      correct: learning.correctCount,
      incorrect: learning.incorrectCount,
      missedQuestions: learning.reviewQuestions.filter((question) => !question.isCorrect).map((question) => ({
        id: question.id,
        text: question.text,
        topic: question.topic,
        explanation: question.explanation,
        selected: question.selectedAnswer,
        correct: question.correctAnswer
      })),
      feedback: {
        feedback: learning.feedback.overall,
        strongTopics: learning.feedback.strongTopics,
        weakTopics: learning.feedback.weakTopics,
        nextSteps: learning.feedback.revisionSteps,
        practiceAction: learning.feedback.recommendedPracticeSet
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
