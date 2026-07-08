import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    const user = requireProfessor(request);
    const classrooms = await prisma.classroom.findMany({
      where: { professorId: user.id },
      include: {
        students: { include: { student: { include: { attempts: true } } } },
        quizzes: true
      }
    });

    const students = classrooms.flatMap((classroom) =>
      classroom.students.map(({ student }) => {
        const attempts = student.attempts.filter((attempt) => classroom.quizzes.some((quiz) => quiz.id === attempt.quizId));
        const averageScore = attempts.length ? Math.round(attempts.reduce((total, attempt) => total + attempt.percentage, 0) / attempts.length) : 0;
        return {
          name: student.name,
          className: classroom.name,
          quizzesTaken: attempts.length,
          averageScore,
          accuracy: averageScore,
          needsAttention: averageScore > 0 && averageScore < 70
        };
      })
    );

    return json({ students });
  } catch (error) {
    return errorResponse(error);
  }
}
