import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { buildAdminSubjectsView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const dataset = await loadReportingDataset(prisma);
    return json({ subjects: buildAdminSubjectsView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
