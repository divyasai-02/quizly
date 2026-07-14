import { cookies } from "next/headers";
import { DemoRoleKey } from "@/lib/demoSession";
import { findUserById } from "@/lib/auth/service";
import { AUTH_COOKIE, readSessionToken } from "@/lib/auth/session";
import type { AppSessionUser } from "@/lib/auth/types";

type RequestWithCookies = Request & {
  cookies?: {
    get(name: string): { value: string } | undefined;
  };
};

function getCookieValue(request: RequestWithCookies | undefined, name: string) {
  if (request?.cookies?.get) {
    return request.cookies.get(name)?.value;
  }

  return cookies().get(name)?.value;
}

export async function getServerUser(request?: RequestWithCookies) {
  const session = await readSessionToken(getCookieValue(request, AUTH_COOKIE));
  if (!session) return null;
  return findUserById(session.userId);
}

export async function requireServerUser(request?: RequestWithCookies) {
  const user = await getServerUser(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Please log in to continue." }), { status: 401 });
  }
  return user;
}

export async function requireServerRole(allowedRoles: DemoRoleKey[], request?: RequestWithCookies) {
  const user = await requireServerUser(request);
  if (!allowedRoles.includes(user.roleKey)) {
    throw new Response(
      JSON.stringify({
        error: `This area is only available to ${allowedRoles.join(" or ")} users.`,
        role: user.roleKey
      }),
      { status: 403 }
    );
  }
  return user;
}

export async function requireProfessor(request?: RequestWithCookies) {
  return requireServerRole(["professor"], request);
}

export async function requireStudent(request?: RequestWithCookies) {
  return requireServerRole(["student"], request);
}

export async function requireAdmin(request?: RequestWithCookies) {
  return requireServerRole(["admin"], request);
}

export function canTakeQuiz(user: AppSessionUser | null) {
  return user?.role === "STUDENT";
}
