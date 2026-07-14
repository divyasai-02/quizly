import { prisma } from "@/lib/prisma";

export type AdminAuditInput = {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAdminAudit(input: AdminAuditInput) {
  return prisma.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined
    }
  });
}

export async function listRecentAdminAudit(limit = 10) {
  const logs = await prisma.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: true }
  });

  return logs.map((log) => ({
    id: log.id,
    actor: log.actor.name,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    metadata: parseMetadata(log.metadata),
    createdAt: log.createdAt.toISOString(),
    createdLabel: log.createdAt.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    })
  }));
}

function parseMetadata(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}
