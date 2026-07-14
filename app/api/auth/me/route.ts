import { errorResponse, json } from "@/lib/http";
import { getServerUser } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    return json({ user: await getServerUser(request) });
  } catch (error) {
    return errorResponse(error);
  }
}
