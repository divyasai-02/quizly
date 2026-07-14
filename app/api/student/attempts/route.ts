import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    const user = await requireStudent(request);
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: user.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      include: { quiz: true },
      orderBy: { createdAt: "desc" }
    });
    return json(attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      subject: attempt.quiz.subject,
      topic: attempt.quiz.topic,
      difficulty: attempt.quiz.difficulty,
      percentage: Math.round(attempt.percentage),
      score: attempt.score,
      totalMarks: attempt.quiz.totalMarks,
      passed: attempt.passed,
      status: attempt.status,
      timeTakenSeconds: attempt.timeTakenSeconds,
      createdAt: attempt.createdAt.toISOString()
    })));
  } catch (error) {
    return errorResponse(error);
  }
}
