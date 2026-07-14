import { errorResponse, json, readJson } from "@/lib/http";
import { assertRateLimit } from "@/lib/rateLimit";
import { requireProfessor } from "@/lib/serverSession";
import { aiService } from "@/lib/services/aiService";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "ai.generateFromNotes", limit: 20, windowMs: 60_000 });
    const body = await readJson<{ notes?: string }>(request);
    return json(await aiService.generateFromNotes({ ...body, userId: (await requireProfessor(request)).id }));
  } catch (error) {
    return errorResponse(error);
  }
}
