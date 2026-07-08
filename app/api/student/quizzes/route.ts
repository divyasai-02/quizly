import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { mapQuizSummary, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request) {
  try {
    const user = requireStudent(request);
    const classrooms = await prisma.classroomStudent.findMany({ where: { studentId: user.id }, select: { classroomId: true } });
    const quizzes = await prisma.quiz.findMany({
      where: { status: "PUBLISHED", classroomId: { in: classrooms.map((item) => item.classroomId) } },
      include: quizInclude
    });
    return json(quizzes.map(mapQuizSummary));
  } catch (error) {
    return errorResponse(error);
  }
}
