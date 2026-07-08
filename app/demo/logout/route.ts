import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE, DEMO_SESSION_COOKIE } from "@/lib/demoSession";

export async function GET(request: Request) {
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete(DEMO_ROLE_COOKIE);
  return NextResponse.redirect(new URL("/", request.url));
}
