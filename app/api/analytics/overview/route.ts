import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const classrooms = await prisma.classroom.findMany({
      where: { professorId: user.id },
      include: {
        students: true,
        quizzes: {
          include: {
            questions: {
              include: {
                answers: {
                  where: { attempt: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } }
                }
              }
            },
            attempts: { where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } }, include: { student: true } }
          }
        }
      }
    });

    const classOverview = classrooms.map((classroom, index) => {
      const attempts = classroom.quizzes.flatMap((quiz) => quiz.attempts);
      const score = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0;
      return {
        name: classroom.name,
        students: classroom.students.length,
        score,
        accuracy: Math.min(100, score + 4),
        engagement: attempts.length >= 3 ? "High" : attempts.length >= 1 ? "Medium" : "Low",
        tone: ["purple", "blue", "pink", "green", "amber"][index % 5]
      };
    });

    const attempts = classrooms.flatMap((classroom) => classroom.quizzes.flatMap((quiz) => quiz.attempts.map((attempt) => ({ ...attempt, className: classroom.name }))));
    const studentPerformance = classrooms.flatMap((classroom) =>
      classroom.quizzes.flatMap((quiz) =>
        quiz.attempts.map((attempt) => ({
          student: attempt.student.name,
          className: classroom.name,
          quizTitle: quiz.title,
          avgScore: Math.round(attempt.percentage),
          accuracy: Math.round(attempt.percentage),
          quizzes: 1
        }))
      )
    )
      .sort((a, b) => b.avgScore - a.avgScore)
      .map((attempt, index) => ({
      rank: index + 1,
      ...attempt
    }));

    const allQuestions = classrooms.flatMap((classroom) =>
      classroom.quizzes.flatMap((quiz) =>
        quiz.questions.map((question, index) => {
          const submittedAnswers = question.answers;
          const correctCount = submittedAnswers.filter((answer) => answer.isCorrect).length;
          const total = submittedAnswers.length;
          const correct = total ? Math.round((correctCount / total) * 100) : 0;
          return {
            question: `Q${index + 1}. ${question.topicTag ?? quiz.topic}`,
            topic: question.topicTag ?? quiz.topic,
            className: classroom.name,
            quizTitle: quiz.title,
            correct,
            incorrect: total ? 100 - correct : 0,
            time: `${question.timeLimitSeconds ?? 60} sec`,
            difficulty: question.difficulty ?? quiz.difficulty
          };
        })
      )
    );
    const questionAnalysis = allQuestions
      .filter((question) => question.correct > 0 || question.incorrect > 0)
      .sort((a, b) => b.incorrect - a.incorrect)
      .slice(0, 6);
    const topicStats = new Map<string, { incorrect: number; count: number }>();
    for (const question of allQuestions) {
      const current = topicStats.get(question.topic) ?? { incorrect: 0, count: 0 };
      current.incorrect += question.incorrect;
      current.count += question.correct > 0 || question.incorrect > 0 ? 1 : 0;
      topicStats.set(question.topic, current);
    }
    const weakTopics = [...topicStats.entries()]
      .filter(([, value]) => value.count > 0)
      .map(([topic, value]) => ({ topic, incorrect: Math.round(value.incorrect / value.count) }))
      .sort((a, b) => b.incorrect - a.incorrect)
      .slice(0, 3);

    const overallAverage = classOverview.length ? Math.round(classOverview.reduce((sum, item) => sum + item.score, 0) / classOverview.length) : 0;
    return json({
      classOverview,
      quizzes: classrooms.flatMap((classroom) => classroom.quizzes.map((quiz) => ({ id: quiz.id, title: quiz.title, className: classroom.name }))),
      studentPerformance,
      questionAnalysis,
      overallAverage,
      weakTopics,
      aiRecommendation: weakTopics[0]
        ? `Students need the most support on ${weakTopics[0].topic}. Review the hardest questions, then generate a short remedial quiz.`
        : "No weak topic yet. Publish a quiz and review results after students submit attempts."
    });
  } catch (error) {
    return errorResponse(error);
  }
}
