import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth/session";
import { clearLegacyDemoCookies } from "@/lib/demoAuth";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") return new Response("Not Found", { status: 404 });
  const cookieStore = await cookies();
  clearAuthCookie(cookieStore);
  clearLegacyDemoCookies(cookieStore);
  return NextResponse.redirect(new URL("/", request.url));
}
