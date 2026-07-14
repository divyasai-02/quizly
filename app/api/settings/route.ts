import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireServerUser } from "@/lib/serverSession";

const DEFAULT_PROFESSOR_SETTINGS = {
  displayName: "Prof. John Doe",
  department: "Computer Science",
  autoSaveDrafts: "Enabled",
  shuffleOptions: "Optional",
  resultVisibility: "After submit",
  aiDraftReview: "Professor approval required"
};

const DEFAULT_STUDENT_SETTINGS = {
  quizReminders: "Enabled",
  leaderboardVisibility: "Public to class",
  aiStudySuggestions: "Enabled",
  theme: "Quizly default",
  locale: "English",
  notifications: "In-app only"
};

function defaultsForRole(roleKey: string) {
  return roleKey === "student" ? DEFAULT_STUDENT_SETTINGS : DEFAULT_PROFESSOR_SETTINGS;
}

async function loadUserSettings(userId: string, roleKey: string) {
  const defaults = defaultsForRole(roleKey);
  const rows = await prisma.userPreference.findMany({ where: { userId } });
  const values: Record<string, string> = { ...defaults };
  for (const row of rows) {
    if (row.key in values) values[row.key as keyof typeof values] = row.value;
  }
  return values;
}

export async function GET(request: Request) {
  try {
    const user = await requireServerUser(request);
    return json({ settings: await loadUserSettings(user.id, user.roleKey), user });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireServerUser(request);
    const defaults = defaultsForRole(user.roleKey);
    const body = await readJson<Record<string, string>>(request);
    const entries = Object.entries(body)
      .filter(([key, value]) => key in defaults && typeof value === "string")
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0);
    if (!entries.length) throw new Error("Update at least one setting.");

    await prisma.$transaction(entries.map(([key, value]) =>
      prisma.userPreference.upsert({
        where: { userId_key: { userId: user.id, key } },
        create: { userId: user.id, key, value },
        update: { value }
      })
    ));

    return json({ settings: await loadUserSettings(user.id, user.roleKey), user });
  } catch (error) {
    return errorResponse(error);
  }
}
