import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { buildQuestionBankWriteData, mapQuestionBankItem, type QuestionBankInput } from "@/lib/questionBank";
import { parseQuestionBankImport } from "@/lib/questionBankImport";
import { requireProfessor } from "@/lib/serverSession";
import { validateQuestionBankItemInput } from "@/lib/validation";

type ImportBody = {
  items?: QuestionBankInput[];
};

async function readImportItems(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Attach a CSV or JSON file.");
    return parseQuestionBankImport(await file.text(), file.name);
  }

  const body = await readJson<ImportBody>(request);
  if (!Array.isArray(body.items)) throw new Error("Import payload must include an items array.");
  return body.items;
}

export async function POST(request: Request) {
  try {
    const user = await requireProfessor(request);
    const items = await readImportItems(request);
    if (!items.length) throw new Error("Import file did not include any questions.");
    if (items.length > 100) throw new Error("Import up to 100 questions at a time.");

    for (const item of items) validateQuestionBankItemInput(item);

    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.questionBankItem.create({
          data: {
            professorId: user.id,
            ...buildQuestionBankWriteData({
              ...item,
              subject: item.subject!,
              topic: item.topic!,
              text: item.text!,
              options: item.options ?? []
            })
          }
        })
      )
    );

    return json({ imported: created.length, items: created.map(mapQuestionBankItem) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
