import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const attempt = await prisma.quizAttempt.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        aiInsights: { orderBy: { createdAt: "desc" } },
        answers: {
          include: {
            question: { include: { options: true } },
            selectedOptions: { include: { option: true } }
          }
        },
        quiz: { include: { questions: true } }
      }
    });
    const missedQuestions = attempt.answers
      .filter((answer) => answer.isCorrect === false)
      .map((answer) => ({
        id: answer.questionId,
        text: answer.question.text,
        topic: answer.question.topicTag ?? attempt.quiz.topic,
        explanation: answer.question.explanation,
        selected: answer.selectedOptions.map((item) => item.option.text),
        correct: answer.question.options.filter((option) => option.isCorrect).map((option) => option.text)
      }));
    const correctTopics = new Set(attempt.answers.filter((answer) => answer.isCorrect).map((answer) => answer.question.topicTag ?? attempt.quiz.topic));
    const weakTopics = [...new Set(missedQuestions.map((question) => question.topic))];
    return json({
      id: attempt.id,
      score: attempt.score,
      totalMarks: attempt.quiz.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      correct: attempt.answers.filter((answer) => answer.isCorrect).length,
      incorrect: attempt.answers.filter((answer) => answer.isCorrect === false).length,
      timeTakenSeconds: attempt.timeTakenSeconds,
      marksObtained: attempt.score,
      weakTopics,
      strongTopics: [...correctTopics].filter((topic) => !weakTopics.includes(topic)),
      missedQuestions,
      feedback: attempt.aiInsights[0] ? JSON.parse(attempt.aiInsights[0].outputJson) : null
    });
  } catch (error) {
    return errorResponse(error);
  }
}
