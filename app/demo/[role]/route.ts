import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getAuthCookieOptions, clearAuthCookie, AUTH_COOKIE } from "@/lib/auth/session";
import { buildSessionUser } from "@/lib/auth/service";
import { clearLegacyDemoCookies } from "@/lib/demoAuth";
import { demoLoginByRole, getRoleHome, normalizeRoleKey } from "@/lib/demoSession";

export async function GET(_request: Request, { params }: { params: { role: string } }) {
  const role = normalizeRoleKey(params.role);
  if (!role) {
    return NextResponse.redirect(new URL("/", "http://localhost"));
  }

  const credentials = demoLoginByRole[role];
  const dbUser = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true
    }
  });

  const user = dbUser ? buildSessionUser(dbUser) : null;
  if (!user) {
    return NextResponse.redirect(new URL("/", "http://localhost"));
  }

  const cookieStore = cookies();
  clearAuthCookie(cookieStore);
  clearLegacyDemoCookies(cookieStore);
  cookieStore.set(AUTH_COOKIE, await createSessionToken({ userId: user.id, roleKey: user.roleKey }), getAuthCookieOptions());

  return NextResponse.redirect(new URL(getRoleHome(user.roleKey), _request.url));
}
