import { cookies } from "next/headers";
import { authenticateUser, AuthError } from "@/lib/auth/service";
import { createSessionToken, getAuthCookieOptions, AUTH_COOKIE } from "@/lib/auth/session";
import { clearLegacyDemoCookies } from "@/lib/demoAuth";
import { errorResponse, json, readJson } from "@/lib/http";
import { assertRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "auth.login", limit: 10, windowMs: 60_000 });
    const user = await authenticateUser(await readJson<{ email?: string; password?: string }>(request));
    const cookieStore = cookies();
    clearLegacyDemoCookies(cookieStore);
    cookieStore.set(AUTH_COOKIE, await createSessionToken({ userId: user.id, roleKey: user.roleKey }), getAuthCookieOptions());
    return json({ user });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error);
  }
}
