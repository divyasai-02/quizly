import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { mapAdminSummaryData } from "@/lib/roleData";
import { requireAdmin } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const [users, classrooms, quizzes, attempts] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.classroom.findMany({ include: { professor: true, students: true, quizzes: true }, orderBy: { createdAt: "asc" } }),
      prisma.quiz.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.quizAttempt.findMany({ include: { quiz: true, student: true }, orderBy: { createdAt: "desc" } })
    ]);

    const totalUsers = users.length;
    const professorCount = users.filter((user) => user.role === UserRole.PROFESSOR).length;
    const studentCount = users.filter((user) => user.role === UserRole.STUDENT).length;
    const subjects = [...new Set(classrooms.map((classroom) => classroom.subject))];

    return json({
      stats: mapAdminSummaryData({
        totalUsers,
        professorCount,
        studentCount,
        classCount: classrooms.length,
        quizCount: quizzes.length,
        activeQuizCount: quizzes.filter((quiz) => quiz.status === "PUBLISHED").length
      }),
      recentActivity: attempts.slice(0, 5).map((attempt) => ({
        id: attempt.id,
        actor: attempt.student.name,
        text: `submitted ${attempt.quiz.title}`,
        time: attempt.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      })),
      classrooms: classrooms.map((classroom) => ({
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        professor: classroom.professor.name,
        studentCount: classroom.students.length,
        quizCount: classroom.quizzes.length
      })),
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: "Active"
      })),
      subjects,
      leaderboard: attempts
        .filter((attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((attempt, index) => ({
          rank: index + 1,
          student: attempt.student.name,
          quiz: attempt.quiz.title,
          score: attempt.score,
          percentage: Math.round(attempt.percentage)
        }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
