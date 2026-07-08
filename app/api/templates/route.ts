import { json } from "@/lib/http";
import { listTemplates } from "@/lib/templates";

export async function GET() {
  return json({ templates: listTemplates() });
}
