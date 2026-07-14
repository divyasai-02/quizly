import { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { createNotification } from "@/lib/services/notificationService";
import {
  buildReportCsv,
  csvTableToExcelHtml,
  csvTableToPdfBuffer,
  csvTableToString,
  loadReportingDataset,
  type ReportFilters
} from "@/lib/services/reportingService";

function getFilters(request: Request): ReportFilters {
  const { searchParams } = new URL(request.url);
  return {
    classId: searchParams.get("classId") ?? undefined,
    quizId: searchParams.get("quizId") ?? undefined,
    studentId: searchParams.get("studentId") ?? undefined,
    reportType: searchParams.get("reportType") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined
  };
}

function normalizeFormat(value: string | null) {
  if (value === "pdf" || value === "excel") return value;
  return "csv";
}

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const { searchParams } = new URL(request.url);
    const format = normalizeFormat(searchParams.get("format"));
    const dataset = await loadReportingDataset(prisma, { professorId: user.id });
    const table = buildReportCsv(dataset, getFilters(request));
    const baseFileName = table.fileName.replace(/\.csv$/, "");

    await createNotification({
      userId: user.id,
      role: UserRole.PROFESSOR,
      context: "reports",
      type: NotificationType.REPORT_GENERATED,
      title: "Report exported",
      message: `Your ${format.toUpperCase()} report export is ready: ${baseFileName}.`,
      actionUrl: "/professor/reports"
    }).catch((error) => {
      console.error("[quizly-notifications] failed to create report export notification", error);
    });

    if (format === "pdf") {
      return new Response(csvTableToPdfBuffer(table), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${baseFileName}.pdf"`
        }
      });
    }

    if (format === "excel") {
      return new Response(csvTableToExcelHtml(table), {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${baseFileName}.xls"`
        }
      });
    }

    return new Response(csvTableToString(table), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${table.fileName}"`
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
