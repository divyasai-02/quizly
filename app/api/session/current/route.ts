import { errorResponse, json } from "@/lib/http";
import { requireServerUser } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    return json({ user: requireServerUser(request) });
  } catch (error) {
    return errorResponse(error);
  }
}
