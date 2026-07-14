import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { quizInclude, mapQuizSummary } from "@/lib/quizTransforms";

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const [classrooms, quizzes] = await Promise.all([
      prisma.classroom.findMany({ where: { professorId: user.id }, include: { students: true, quizzes: true } }),
      prisma.quiz.findMany({ where: { professorId: user.id }, include: quizInclude, orderBy: { createdAt: "desc" } })
    ]);

    return json({
      stats: [
        { label: "Classes", value: String(classrooms.length), hint: "Total classes", tone: "purple" },
        { label: "Active Quizzes", value: String(quizzes.filter((quiz) => quiz.status === "PUBLISHED").length), hint: "Live quizzes", tone: "green" },
        { label: "Drafts", value: String(quizzes.filter((quiz) => quiz.status === "DRAFT").length), hint: "Unpublished", tone: "amber" },
        { label: "Completed", value: String(await prisma.quizAttempt.count({ where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } })), hint: "Finished attempts", tone: "blue" },
        { label: "Closed Quizzes", value: String(quizzes.filter((quiz) => quiz.status === "CLOSED").length), hint: "Archived quizzes", tone: "pink" }
      ],
      classes: classrooms.map((item) => ({
        id: item.id,
        code: item.name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase(),
        name: item.name,
        students: item.students.length,
        quizzes: item.quizzes.length,
        activity: "Recently"
      })),
      quizzes: quizzes.map(mapQuizSummary)
    });
  } catch (error) {
    return errorResponse(error);
  }
}
