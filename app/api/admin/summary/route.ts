import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { listRecentAdminAudit } from "@/lib/services/adminAuditService";
import { buildAdminSummaryView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const dataset = await loadReportingDataset(prisma);
    const summary = buildAdminSummaryView(dataset);
    return json({ ...summary, auditTrail: await listRecentAdminAudit(8) });
  } catch (error) {
    return errorResponse(error);
  }
}
