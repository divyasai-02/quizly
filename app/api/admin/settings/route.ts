import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";

const DEFAULT_SETTINGS = {
  brandName: "Quizly",
  locale: "English",
  theme: "Quizly default",
  systemNotices: "In-app only"
};

type AdminSettingsInput = Partial<typeof DEFAULT_SETTINGS>;

async function loadSettings() {
  const rows = await prisma.platformSetting.findMany();
  const values = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (row.key in values) values[row.key as keyof typeof values] = row.value;
  }
  return values;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return json({ settings: await loadSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await readJson<AdminSettingsInput>(request);
    const entries = Object.entries(body)
      .filter(([key, value]) => key in DEFAULT_SETTINGS && typeof value === "string")
      .map(([key, value]) => [key, value!.trim()] as const)
      .filter(([, value]) => value.length > 0);
    if (!entries.length) throw new Error("Update at least one setting.");

    await prisma.$transaction(entries.map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value }
      })
    ));

    await recordAdminAudit({
      actorId: actor.id,
      action: "settings.update",
      entity: "platformSetting",
      metadata: { keys: entries.map(([key]) => key) }
    });

    return json({ settings: await loadSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}
