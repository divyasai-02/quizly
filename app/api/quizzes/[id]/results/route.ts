import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id } });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can view results.");

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId: params.id, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      include: { student: true },
      orderBy: { score: "desc" }
    });
    return json({
      attempts: attempts.map((attempt, index) => ({
        rank: index + 1,
        student: attempt.student.name,
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        timeTakenSeconds: attempt.timeTakenSeconds
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
