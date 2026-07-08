import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE, getRoleHome, normalizeRoleKey, resolveDemoUser } from "@/lib/demoSession";

const rolePrefixes = {
  professor: "/professor",
  student: "/student",
  admin: "/admin"
} as const;

const legacyRedirects: Record<string, (role: "professor" | "student" | "admin") => string> = {
  "/dashboard": () => "/professor/dashboard",
  "/classes": () => "/professor/classes",
  "/create-quiz": () => "/professor/create-quiz",
  "/analytics": () => "/professor/analytics",
  "/question-bank": () => "/professor/question-bank",
  "/templates": () => "/professor/templates",
  "/settings": (role) => (role === "student" ? "/student/settings" : role === "admin" ? "/admin/settings" : "/professor/settings"),
  "/help": () => "/professor/help",
  "/leaderboard": (role) => (role === "admin" ? "/admin/leaderboards" : "/student/leaderboards")
};

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/professor") || pathname.startsWith("/student") || pathname.startsWith("/admin");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const roleKey = normalizeRoleKey(request.cookies.get(DEMO_ROLE_COOKIE)?.value);
  const user = resolveDemoUser(request.cookies.get(DEMO_SESSION_COOKIE)?.value, roleKey);

  if (pathname in legacyRedirects) {
    const role = user?.roleKey ?? "professor";
    return NextResponse.redirect(new URL(legacyRedirects[pathname](role), request.url));
  }

  if (pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL(getRoleHome(user.roleKey), request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/quiz/")) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const requiredRole = pathname.startsWith(rolePrefixes.professor)
    ? "professor"
    : pathname.startsWith(rolePrefixes.student)
      ? "student"
      : "admin";

  if (user.roleKey !== requiredRole) {
    return NextResponse.redirect(new URL(getRoleHome(user.roleKey), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/classes", "/create-quiz", "/analytics", "/question-bank", "/templates", "/settings", "/help", "/leaderboard", "/professor/:path*", "/student/:path*", "/admin/:path*", "/quiz/:path*"]
};
