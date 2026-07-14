import { demoUsers, DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE, normalizeRoleKey, resolveDemoUser, type DemoUserSession } from "@/lib/demoSession";

export const DEMO_AUTH_COOKIE = "quizly-demo-auth";

const DEMO_AUTH_SECRET = "quizly-local-demo-session-v1";

function signDemoSession(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function createDemoAuthToken(user: Pick<DemoUserSession, "id" | "roleKey">) {
  const payload = `${user.id}.${user.roleKey}`;
  return `${payload}.${signDemoSession(`${DEMO_AUTH_SECRET}.${payload}`)}`;
}

export function resolveDemoAuthToken(token?: string | null) {
  if (!token) return null;

  const [userId, roleKey, signature] = token.split(".");
  const normalizedRole = normalizeRoleKey(roleKey);
  if (!userId || !normalizedRole || !signature) {
    return null;
  }

  const expected = signDemoSession(`${DEMO_AUTH_SECRET}.${userId}.${normalizedRole}`);
  if (signature !== expected) {
    return null;
  }

  return resolveDemoUser(userId, normalizedRole);
}

export function getDemoAuthCookieOptions() {
  return {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
    httpOnly: true
  };
}

export function clearLegacyDemoCookies(cookieStore: { delete(name: string): void }) {
  cookieStore.delete(DEMO_AUTH_COOKIE);
  cookieStore.delete(DEMO_SESSION_COOKIE);
  cookieStore.delete(DEMO_ROLE_COOKIE);
}

export function getDemoUserForRole(role: string | null | undefined) {
  const normalizedRole = normalizeRoleKey(role);
  return normalizedRole ? demoUsers[normalizedRole] : null;
}
