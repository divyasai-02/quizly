import { NotificationType, QuizStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";
import { createNotifications } from "@/lib/services/notificationService";
import { validatePublish } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        questions: { include: { options: true } },
        classroom: { include: { students: { select: { studentId: true } } } }
      }
    });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can publish it.");
    validatePublish(quiz.questions);
    const updated = await prisma.quiz.update({
      where: { id: params.id },
      data: { status: QuizStatus.PUBLISHED, publishedAt: new Date() },
      include: quizInclude
    });

    const studentIds = quiz.classroom?.students.map((student) => student.studentId) ?? [];
    if (studentIds.length) {
      await createNotifications(studentIds.map((studentId) => ({
        userId: studentId,
        role: UserRole.STUDENT,
        context: "assignment",
        type: NotificationType.NEW_QUIZ_ASSIGNED,
        title: "New quiz assigned",
        message: `${quiz.title} is now available${quiz.classroom?.name ? ` for ${quiz.classroom.name}` : ""}.`,
        actionUrl: `/quiz/${quiz.id}/instructions`
      }))).catch((error) => {
        console.error("[quizly-notifications] failed to create publish notifications", error);
      });
    }

    return json(mapQuizDetail(updated));
  } catch (error) {
    return errorResponse(error);
  }
}
