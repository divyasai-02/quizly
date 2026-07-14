import { cookies } from "next/headers";
import { clearAuthCookie } from "@/lib/auth/session";
import { clearLegacyDemoCookies } from "@/lib/demoAuth";
import { errorResponse, json } from "@/lib/http";

export async function POST() {
  try {
    const cookieStore = cookies();
    clearAuthCookie(cookieStore);
    clearLegacyDemoCookies(cookieStore);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
