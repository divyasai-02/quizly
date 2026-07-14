import { NotificationType, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { AuthError, registerUser } from "@/lib/auth/service";
import { createSessionToken, getAuthCookieOptions, AUTH_COOKIE } from "@/lib/auth/session";
import { clearLegacyDemoCookies } from "@/lib/demoAuth";
import { errorResponse, json, readJson } from "@/lib/http";
import { assertRateLimit } from "@/lib/rateLimit";
import { createRoleNotifications } from "@/lib/services/notificationService";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "auth.register", limit: 5, windowMs: 60_000 });
    const user = await registerUser(
      await readJson<{
        confirmPassword?: string;
        email?: string;
        name?: string;
        password?: string;
        role?: string;
      }>(request)
    );

    const cookieStore = cookies();
    clearLegacyDemoCookies(cookieStore);
    cookieStore.set(AUTH_COOKIE, await createSessionToken({ userId: user.id, roleKey: user.roleKey }), getAuthCookieOptions());
    await createRoleNotifications(UserRole.ADMIN, {
      context: "user-registration",
      type: NotificationType.ADMIN_NEW_USER_REGISTERED,
      title: "New user registered",
      message: `${user.name} created a ${user.roleKey} account on Quizly.`,
      actionUrl: "/admin/users"
    }).catch((error) => {
      console.error("[quizly-notifications] failed to create registration notifications", error);
    });
    return json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, { status: error.status });
    }
    return errorResponse(error);
  }
}
