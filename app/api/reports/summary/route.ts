import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { buildProfessorReportsView, loadReportingDataset, type ReportFilters } from "@/lib/services/reportingService";

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

export async function GET(request: Request) {
  try {
    const user = requireProfessor(request);
    const dataset = await loadReportingDataset(prisma, { professorId: user.id });
    return json(buildProfessorReportsView(dataset, getFilters(request)));
  } catch (error) {
    return errorResponse(error);
  }
}
