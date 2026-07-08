import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE, getRoleHome, normalizeRoleKey, resolveDemoUser } from "@/lib/demoSession";

export async function GET(_request: Request, { params }: { params: { role: string } }) {
  const role = normalizeRoleKey(params.role);
  if (!role) {
    return NextResponse.redirect(new URL("/", "http://localhost"));
  }

  const user = resolveDemoUser(undefined, role);
  if (!user) {
    return NextResponse.redirect(new URL("/", "http://localhost"));
  }

  cookies().set(DEMO_SESSION_COOKIE, user.id, { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  cookies().set(DEMO_ROLE_COOKIE, user.roleKey, { path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });

  return NextResponse.redirect(new URL(getRoleHome(user.roleKey), _request.url));
}
