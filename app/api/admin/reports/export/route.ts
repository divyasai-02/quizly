import { NotificationType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";
import { createNotification } from "@/lib/services/notificationService";
import {
  csvTableToExcelHtml,
  csvTableToPdfBuffer,
  csvTableToString,
  loadReportingDataset
} from "@/lib/services/reportingService";

type InstitutionCsvTable = {
  fileName: string;
  rows: string[][];
};

function normalizeFormat(value: string | null) {
  if (value === "pdf" || value === "excel") return value;
  return "csv";
}

function buildInstitutionReport(dataset: Awaited<ReturnType<typeof loadReportingDataset>>): InstitutionCsvTable {
  const submittedAttempts = dataset.attempts.filter((attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED");
  const averageScore = submittedAttempts.length
    ? Math.round(submittedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / submittedAttempts.length)
    : 0;
  return {
    fileName: `institution-overview-${new Date().toISOString().slice(0, 10)}.csv`,
    rows: [
      ["Metric", "Value", "Detail"],
      ["Total users", String(dataset.users.length), "All platform accounts"],
      ["Professors", String(dataset.users.filter((user) => user.role === "PROFESSOR").length), "Teaching accounts"],
      ["Students", String(dataset.users.filter((user) => user.role === "STUDENT").length), "Learner accounts"],
      ["Classes", String(dataset.classrooms.length), "Active classrooms"],
      ["Quizzes", String(dataset.quizzes.length), "Draft, published, and closed quizzes"],
      ["Submitted attempts", String(submittedAttempts.length), "Completed learner submissions"],
      ["Average score", `${averageScore}%`, "Across submitted attempts"],
      ["Question bank items", String(dataset.questionBankItems.length), "Reusable teaching content"],
      ["AI generations", String(dataset.aiInsights.length), "Recorded AI activity"]
    ]
  };
}

export async function GET(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const format = normalizeFormat(searchParams.get("format"));
    const dataset = await loadReportingDataset(prisma);
    const table = buildInstitutionReport(dataset);
    const baseFileName = table.fileName.replace(/\.csv$/, "");

    await Promise.all([
      recordAdminAudit({
        actorId: actor.id,
        action: "institution_report.export",
        entity: "report",
        metadata: { format }
      }),
      createNotification({
        userId: actor.id,
        role: UserRole.ADMIN,
        context: "admin-reports",
        type: NotificationType.REPORT_GENERATED,
        title: "Institution report exported",
        message: `Your ${format.toUpperCase()} institution report is ready: ${baseFileName}.`,
        actionUrl: "/admin/reports"
      }).catch(() => null)
    ]);

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
