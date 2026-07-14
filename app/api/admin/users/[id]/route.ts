import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";
import { buildAdminUsersView, loadReportingDataset } from "@/lib/services/reportingService";

type AdminUserAction = {
  action?: "changeRole" | "deactivate" | "reactivate";
  role?: UserRole;
};

function parseRole(value?: string) {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === UserRole.ADMIN || normalized === UserRole.PROFESSOR || normalized === UserRole.STUDENT) {
    return normalized;
  }
  return null;
}

async function ensureAdminContinuity(targetId: string, actorId: string, role?: UserRole) {
  if (targetId === actorId && role && role !== UserRole.ADMIN) {
    throw new Error("You cannot remove your own administrator role.");
  }

  const activeAdmins = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      disabledAt: null,
      id: { not: targetId }
    }
  });

  if (activeAdmins === 0 && role !== UserRole.ADMIN) {
    throw new Error("At least one active administrator must remain.");
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const actor = await requireAdmin(request);
    const body = await readJson<AdminUserAction>(request);
    const target = await prisma.user.findUniqueOrThrow({ where: { id: params.id } });

    if (body.action === "changeRole") {
      const role = parseRole(body.role);
      if (!role) throw new Error("Choose a valid role.");
      if (target.role === UserRole.ADMIN || role === UserRole.ADMIN) {
        await ensureAdminContinuity(target.id, actor.id, role);
      }
      await prisma.user.update({ where: { id: target.id }, data: { role } });
      await recordAdminAudit({
        actorId: actor.id,
        action: "user.change_role",
        entity: "user",
        entityId: target.id,
        metadata: { fromRole: target.role, toRole: role, email: target.email }
      });
    } else if (body.action === "deactivate") {
      if (target.id === actor.id) throw new Error("You cannot deactivate your own account.");
      if (target.role === UserRole.ADMIN) {
        await ensureAdminContinuity(target.id, actor.id);
      }
      await prisma.user.update({ where: { id: target.id }, data: { disabledAt: new Date() } });
      await recordAdminAudit({
        actorId: actor.id,
        action: "user.deactivate",
        entity: "user",
        entityId: target.id,
        metadata: { role: target.role, email: target.email }
      });
    } else if (body.action === "reactivate") {
      await prisma.user.update({ where: { id: target.id }, data: { disabledAt: null } });
      await recordAdminAudit({
        actorId: actor.id,
        action: "user.reactivate",
        entity: "user",
        entityId: target.id,
        metadata: { role: target.role, email: target.email }
      });
    } else {
      throw new Error("Choose a valid user action.");
    }

    const dataset = await loadReportingDataset(prisma);
    return json({ users: buildAdminUsersView(dataset) });
  } catch (error) {
    return errorResponse(error);
  }
}
