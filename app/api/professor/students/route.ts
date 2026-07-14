import { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { createNotification } from "@/lib/services/notificationService";
import { buildProfessorStudentsView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const dataset = await loadReportingDataset(prisma, { professorId: user.id });
    return json(buildProfessorStudentsView(dataset));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProfessor(request);
    const body = await readJson<{ studentId?: string; message?: string }>(request);
    const studentId = body.studentId?.trim();
    const message = body.message?.trim();
    if (!studentId) throw new Error("Choose a student.");
    if (!message) throw new Error("Enter a message.");
    if (message.length > 500) throw new Error("Message must be 500 characters or fewer.");

    const enrollment = await prisma.classroomStudent.findFirst({
      where: {
        studentId,
        classroom: { professorId: user.id }
      },
      include: { student: true, classroom: true }
    });
    if (!enrollment) throw new Error("You can only message students in your classes.");

    const notification = await createNotification({
      userId: studentId,
      role: UserRole.STUDENT,
      type: NotificationType.STUDENT_PERFORMANCE_RISK,
      title: `Message from ${user.name}`,
      message,
      context: `class:${enrollment.classroom.name}`,
      actionUrl: "/student/notifications"
    });

    return json({ ok: true, notification });
  } catch (error) {
    return errorResponse(error);
  }
}
