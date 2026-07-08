import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { buildDuplicateQuestionBankItemData, mapQuestionBankItem } from "@/lib/questionBank";
import { requireProfessor } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const existing = await prisma.questionBankItem.findUniqueOrThrow({ where: { id: params.id } });
    if (existing.professorId !== user.id) throw new Error("You can only duplicate your own question bank items.");
    const clone = await prisma.questionBankItem.create({
      data: buildDuplicateQuestionBankItemData(existing, user.id)
    });
    return json(mapQuestionBankItem(clone), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
