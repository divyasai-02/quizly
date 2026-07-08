import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { mapStudentDashboardData } from "@/lib/roleData";
import { requireStudent } from "@/lib/serverSession";
import { mapQuizSummary, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request) {
  try {
    const user = requireStudent(request);
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

    const summary = mapStudentDashboardData({
      studentName: user.name,
      activeQuizCount: quizzes.length,
      enrolledClassCount: enrollments.length,
      attempts: attempts.map((attempt) => ({
        score: attempt.score,
        percentage: attempt.percentage,
        topic: attempt.quiz.topic,
        quizTitle: attempt.quiz.title,
        subject: attempt.quiz.subject,
        status: attempt.status,
        createdAt: attempt.createdAt
      }))
    });

    return json({
      ...summary,
      latestQuizzes: quizzes.slice(0, 4).map(mapQuizSummary),
      classes: enrollments.map((item) => ({
        id: item.classroom.id,
        name: item.classroom.name,
        subject: item.classroom.subject,
        professor: item.classroom.professor.name
      })),
      completedHistory: attempts.slice(0, 5).map((attempt) => ({
        id: attempt.id,
        title: attempt.quiz.title,
        percentage: Math.round(attempt.percentage),
        status: attempt.status
      }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
