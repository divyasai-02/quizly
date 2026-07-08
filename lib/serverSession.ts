import "server-only";

import { cookies } from "next/headers";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE, DemoRoleKey, DemoUserSession, resolveDemoUser } from "@/lib/demoSession";

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

export function getServerUser(request?: RequestWithCookies) {
  return resolveDemoUser(getCookieValue(request, DEMO_SESSION_COOKIE), getCookieValue(request, DEMO_ROLE_COOKIE));
}

export function requireServerUser(request?: RequestWithCookies) {
  const user = getServerUser(request);
  if (!user) {
    throw new Response(JSON.stringify({ error: "No active demo session. Choose a role to continue." }), { status: 401 });
  }
  return user;
}

export function requireServerRole(allowedRoles: DemoRoleKey[], request?: RequestWithCookies) {
  const user = requireServerUser(request);
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

export function requireProfessor(request?: RequestWithCookies) {
  return requireServerRole(["professor"], request);
}

export function requireStudent(request?: RequestWithCookies) {
  return requireServerRole(["student"], request);
}

export function requireAdmin(request?: RequestWithCookies) {
  return requireServerRole(["admin"], request);
}

export function canTakeQuiz(user: DemoUserSession | null) {
  return user?.role === "STUDENT";
}
