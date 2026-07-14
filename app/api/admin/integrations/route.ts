import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/serverSession";
import { recordAdminAudit } from "@/lib/services/adminAuditService";

const DEFAULT_INTEGRATIONS = {
  webhookUrl: "",
  webhookEnabled: "false",
  sisProvider: "Manual CSV",
  lmsProvider: "Not connected",
  notificationChannel: "In-app"
};

type IntegrationInput = Partial<typeof DEFAULT_INTEGRATIONS>;

const settingKey = (key: string) => `integration.${key}`;

async function loadIntegrations() {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { startsWith: "integration." } }
  });
  const settings = { ...DEFAULT_INTEGRATIONS };
  for (const row of rows) {
    const key = row.key.replace(/^integration\./, "");
    if (key in settings) settings[key as keyof typeof settings] = row.value;
  }
  return settings;
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return json({ integrations: await loadIntegrations() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const body = await readJson<IntegrationInput>(request);
    const entries = Object.entries(body)
      .filter(([key, value]) => key in DEFAULT_INTEGRATIONS && typeof value === "string")
      .map(([key, value]) => [key, value!.trim()] as const);
    if (!entries.length) throw new Error("Update at least one integration setting.");

    const webhookUrl = body.webhookUrl?.trim();
    if (webhookUrl && !/^https?:\/\//i.test(webhookUrl)) {
      throw new Error("Webhook URL must start with http:// or https://.");
    }

    await prisma.$transaction(entries.map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key: settingKey(key) },
        create: { key: settingKey(key), value },
        update: { value }
      })
    ));

    await recordAdminAudit({
      actorId: actor.id,
      action: "integrations.update",
      entity: "platformSetting",
      metadata: { keys: entries.map(([key]) => key) }
    });

    return json({ integrations: await loadIntegrations() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);
    const integrations = await loadIntegrations();
    if (integrations.webhookEnabled !== "true") throw new Error("Enable the webhook before sending a test event.");
    if (!integrations.webhookUrl) throw new Error("Enter a webhook URL before sending a test event.");

    const response = await fetch(integrations.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "quizly.integration.test",
        sentAt: new Date().toISOString(),
        source: "Quizly Admin"
      })
    });

    await recordAdminAudit({
      actorId: actor.id,
      action: "integrations.test_webhook",
      entity: "platformSetting",
      metadata: { status: response.status, ok: response.ok }
    });

    return json({ ok: response.ok, status: response.status });
  } catch (error) {
    return errorResponse(error);
  }
}
