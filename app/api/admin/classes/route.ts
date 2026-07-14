import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { buildAdminClassesView, loadReportingDataset } from "@/lib/services/reportingService";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const dataset = await loadReportingDataset(prisma);
    return json({
      classes: buildAdminClassesView(dataset),
      professors: dataset.users
        .filter((user) => user.role === "PROFESSOR" && !user.disabledAt)
        .map((user) => ({ id: user.id, name: user.name, email: user.email }))
    });
  } catch (error) {
    return errorResponse(error);
  }
}
