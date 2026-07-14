import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { mapQuizSummary, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request) {
  try {
    const user = await requireStudent(request);
    const classrooms = await prisma.classroomStudent.findMany({
      where: { studentId: user.id },
      include: {
        classroom: {
          include: {
            professor: true,
            quizzes: { include: quizInclude, orderBy: { createdAt: "desc" } }
          }
        }
      }
    });
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: user.id },
      include: { quiz: true }
    });

    return json({
      classrooms: classrooms.map(({ classroom }) => {
        const classAttempts = attempts.filter((attempt) => attempt.quiz.classroomId === classroom.id);
        const averagePerformance = classAttempts.length
          ? Math.round(classAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / classAttempts.length)
          : 0;
        return {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject,
          professor: classroom.professor.name,
          quizCount: classroom.quizzes.length,
          averagePerformance,
          assignedQuizzes: classroom.quizzes.map(mapQuizSummary)
        };
      })
    });
  } catch (error) {
    return errorResponse(error);
  }
}
