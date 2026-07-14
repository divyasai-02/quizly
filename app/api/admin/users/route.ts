import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { buildAdminUsersView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const dataset = await loadReportingDataset(prisma);
    return json({ users: buildAdminUsersView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
