import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { NotificationType, UserRole } from "@prisma/client";
import { createNotification } from "@/lib/services/notificationService";
import { buildStudentProgressCsv, csvTableToString, loadReportingDataset, type ReportFilters } from "@/lib/services/reportingService";

function getFilters(request: Request): ReportFilters {
  const { searchParams } = new URL(request.url);
  return {
    classId: searchParams.get("classId") ?? undefined,
    quizId: searchParams.get("quizId") ?? undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined
  };
}

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const dataset = await loadReportingDataset(prisma, { professorId: user.id });
    const csv = buildStudentProgressCsv(dataset, getFilters(request));
    const { searchParams } = new URL(request.url);

    if (searchParams.get("format") === "csv") {
      await createNotification({
        userId: user.id,
        role: UserRole.PROFESSOR,
        context: "reports",
        type: NotificationType.REPORT_GENERATED,
        title: "Student progress report exported",
        message: `Your student progress CSV export is ready: ${csv.fileName}.`,
        actionUrl: "/professor/reports"
      }).catch((error) => {
        console.error("[quizly-notifications] failed to create student-progress report notification", error);
      });
      return new Response(csvTableToString(csv), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${csv.fileName}"`
        }
      });
    }

    return json({
      fileName: csv.fileName,
      headers: csv.rows[0],
      rows: csv.rows.slice(1)
    });
  } catch (error) {
    return errorResponse(error);
  }
}
