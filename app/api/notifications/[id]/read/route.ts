import { markNotificationRead, userRoleFromRoleKey } from "@/lib/services/notificationService";
import { errorResponse, json } from "@/lib/http";
import { requireServerUser } from "@/lib/serverSession";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await requireServerUser(request);
    return json(await markNotificationRead(params.id, user.id, userRoleFromRoleKey(user.roleKey)));
  } catch (error) {
    return errorResponse(error);
  }
}
