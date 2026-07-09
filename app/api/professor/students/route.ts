import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { buildProfessorStudentsView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    const user = requireProfessor(request);
    const dataset = await loadReportingDataset(prisma, { professorId: user.id });
    return json(buildProfessorStudentsView(dataset));
  } catch (error) {
    return errorResponse(error);
  }
}
