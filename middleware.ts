import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, readSessionToken } from "@/lib/auth/session";
import { getRoleHome } from "@/lib/demoSession";

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

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://openrouter.ai https://api.anthropic.com",
    "frame-ancestors 'none'"
  ].join("; "));
  return response;
}

function redirect(url: URL) {
  return withSecurityHeaders(NextResponse.redirect(url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await readSessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  const user = session ? { roleKey: session.roleKey } : null;

  if (pathname in legacyRedirects) {
    const role = user?.roleKey ?? "professor";
    return redirect(new URL(legacyRedirects[pathname](role), request.url));
  }

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    if (user) {
      return redirect(new URL(getRoleHome(user.roleKey), request.url));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/quiz/")) {
    if (!user) {
      return redirect(new URL("/", request.url));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (!isProtectedPath(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  if (!user) {
    return redirect(new URL("/", request.url));
  }

  const requiredRole = pathname.startsWith(rolePrefixes.professor)
    ? "professor"
    : pathname.startsWith(rolePrefixes.student)
      ? "student"
      : "admin";

  if (user.roleKey !== requiredRole) {
    return redirect(new URL(getRoleHome(user.roleKey), request.url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard", "/classes", "/create-quiz", "/analytics", "/question-bank", "/templates", "/settings", "/help", "/leaderboard", "/professor/:path*", "/student/:path*", "/admin/:path*", "/quiz/:path*", "/api/:path*"]
};
