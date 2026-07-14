import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";
import { buildAdminSubjectsView, loadReportingDataset } from "@/lib/services/reportingService";

type SubjectActionInput = {
  action?: "merge" | "rename";
  targetSubject?: string;
};

function decodeSubject(value: string) {
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

function cleanSubject(value?: string) {
  const next = value?.trim();
  if (!next) throw new Error("Enter a target subject.");
  return next;
}

export async function PATCH(request: Request, { params }: { params: { subject: string } }) {
  try {
    const actor = await requireAdmin(request);
    const sourceSubject = decodeSubject(params.subject);
    const body = await readJson<SubjectActionInput>(request);
    const targetSubject = cleanSubject(body.targetSubject);

    if (sourceSubject.toLowerCase() === targetSubject.toLowerCase()) {
      throw new Error("Choose a different subject name.");
    }
    if (body.action !== "rename" && body.action !== "merge") {
      throw new Error("Choose a valid subject action.");
    }

    await prisma.$transaction([
      prisma.classroom.updateMany({ where: { subject: sourceSubject }, data: { subject: targetSubject } }),
      prisma.quiz.updateMany({ where: { subject: sourceSubject }, data: { subject: targetSubject } }),
      prisma.questionBankItem.updateMany({ where: { subject: sourceSubject }, data: { subject: targetSubject } })
    ]);

    await recordAdminAudit({
      actorId: actor.id,
      action: `subject.${body.action}`,
      entity: "subject",
      entityId: sourceSubject,
      metadata: { sourceSubject, targetSubject }
    });

    const dataset = await loadReportingDataset(prisma);
    return json({ subjects: buildAdminSubjectsView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
