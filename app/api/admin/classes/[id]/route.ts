import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";
import { buildAdminClassesView, loadReportingDataset } from "@/lib/services/reportingService";

type ClassUpdateInput = {
  name?: string;
  professorId?: string;
  section?: string;
  subject?: string;
};

function cleanText(value: string | undefined, fallback: string) {
  const next = value?.trim();
  return next?.length ? next : fallback;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdmin(request);
    const body = await readJson<ClassUpdateInput>(request);
    const existing = await prisma.classroom.findUniqueOrThrow({ where: { id: params.id } });
    const professorId = body.professorId?.trim() || existing.professorId;

    const professor = await prisma.user.findFirst({
      where: {
        id: professorId,
        role: "PROFESSOR",
        disabledAt: null
      }
    });
    if (!professor) {
      throw new Error("Choose an active professor for this class.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.classroom.update({
        where: { id: existing.id },
        data: {
          name: cleanText(body.name, existing.name),
          subject: cleanText(body.subject, existing.subject),
          section: body.section?.trim() || null,
          professorId
        }
      });

      if (professorId !== existing.professorId) {
        await tx.quiz.updateMany({
          where: { classroomId: existing.id },
          data: { professorId }
        });
      }
    });

    await recordAdminAudit({
      actorId: actor.id,
      action: "classroom.update",
      entity: "classroom",
      entityId: existing.id,
      metadata: {
        from: { name: existing.name, subject: existing.subject, section: existing.section, professorId: existing.professorId },
        to: {
          name: cleanText(body.name, existing.name),
          subject: cleanText(body.subject, existing.subject),
          section: body.section?.trim() || null,
          professorId
        }
      }
    });

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
