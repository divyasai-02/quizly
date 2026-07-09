import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { buildAdminClassesView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const dataset = await loadReportingDataset(prisma);
    return json({ classes: buildAdminClassesView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
