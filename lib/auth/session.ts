import { normalizeRoleKey, type DemoRoleKey } from "@/lib/demoSession";

export const AUTH_COOKIE = "quizly-auth";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_SECRET = process.env.QUIZLY_AUTH_SECRET ?? process.env.AUTH_SECRET ?? "quizly-local-auth-secret-change-me";

type SessionTokenPayload = {
  exp: number;
  roleKey: DemoRoleKey;
  userId: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

async function importAuthKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createSignature(encodedPayload: string) {
  const signature = await crypto.subtle.sign("HMAC", await importAuthKey(), new TextEncoder().encode(encodedPayload));
  let binary = "";
  new Uint8Array(signature).forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return base64UrlEncode(binary);
}

export async function createSessionToken(input: { roleKey: DemoRoleKey; userId: string }) {
  const payload: SessionTokenPayload = {
    userId: input.userId,
    roleKey: input.roleKey,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await createSignature(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function readSessionToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await createSignature(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SessionTokenPayload;
    const roleKey = normalizeRoleKey(parsed.roleKey);
    if (!parsed.userId || !roleKey || parsed.exp * 1000 <= Date.now()) {
      return null;
    }

    return {
      userId: parsed.userId,
      roleKey,
      exp: parsed.exp
    };
  } catch {
    return null;
  }
}

export function getAuthCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS
  };
}

export function clearAuthCookie(cookieStore: { delete(name: string): void }) {
  cookieStore.delete(AUTH_COOKIE);
}
