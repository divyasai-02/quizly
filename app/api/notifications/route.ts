import { userRoleFromRoleKey, listNotificationsForUser } from "@/lib/services/notificationService";
import { errorResponse, json } from "@/lib/http";
import { requireServerUser } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    const user = await requireServerUser(request);
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const parsedLimit = limit ? Number(limit) : undefined;

    return json(await listNotificationsForUser(user.id, userRoleFromRoleKey(user.roleKey), {
      limit: Number.isFinite(parsedLimit) && parsedLimit && parsedLimit > 0 ? parsedLimit : undefined
    }));
  } catch (error) {
    return errorResponse(error);
  }
}
