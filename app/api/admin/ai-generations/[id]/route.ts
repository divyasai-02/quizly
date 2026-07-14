import { AIInsightModerationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";
import { buildAdminAiGenerationsView, loadReportingDataset } from "@/lib/services/reportingService";

type ModerationActionInput = {
  action?: "approve" | "flag" | "hide" | "restore";
  note?: string;
};

function updateForAction(action: ModerationActionInput["action"], actorId: string, note?: string) {
  const base = {
    moderatedAt: new Date(),
    moderatedById: actorId,
    moderationNote: note?.trim() || null
  };

  if (action === "approve") {
    return { ...base, moderationStatus: AIInsightModerationStatus.ACCEPTED, hiddenAt: null };
  }
  if (action === "flag") {
    return { ...base, moderationStatus: AIInsightModerationStatus.FLAGGED, hiddenAt: null };
  }
  if (action === "hide") {
    return { ...base, moderationStatus: AIInsightModerationStatus.HIDDEN, hiddenAt: new Date() };
  }
  if (action === "restore") {
    return { ...base, moderationStatus: AIInsightModerationStatus.PENDING, hiddenAt: null };
  }

  throw new Error("Choose a valid moderation action.");
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdmin(request);
    const body = await readJson<ModerationActionInput>(request);

    const updated = await prisma.aIInsight.update({
      where: { id: params.id },
      data: updateForAction(body.action, actor.id, body.note)
    });

    await recordAdminAudit({
      actorId: actor.id,
      action: `ai_generation.${body.action}`,
      entity: "aiInsight",
      entityId: updated.id,
      metadata: { moderationStatus: updated.moderationStatus, note: body.note?.trim() || null }
    });

    const dataset = await loadReportingDataset(prisma);
    return json({ generations: buildAdminAiGenerationsView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
