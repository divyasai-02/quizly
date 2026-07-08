import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { buildQuestionBankWriteData, mapQuestionBankItem, type QuestionBankInput } from "@/lib/questionBank";
import { requireProfessor } from "@/lib/serverSession";
import { validateQuestionBankItemInput } from "@/lib/validation";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const item = await prisma.questionBankItem.findUniqueOrThrow({ where: { id: params.id } });
    if (item.professorId !== user.id) throw new Error("You can only view your own question bank items.");
    return json(mapQuestionBankItem(item));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const existing = await prisma.questionBankItem.findUniqueOrThrow({ where: { id: params.id } });
    if (existing.professorId !== user.id) throw new Error("You can only edit your own question bank items.");
    const body = await readJson<QuestionBankInput>(request);
    validateQuestionBankItemInput(body);
    const item = await prisma.questionBankItem.update({
      where: { id: params.id },
      data: buildQuestionBankWriteData({
        ...body,
        difficulty: body.difficulty ?? existing.difficulty,
        marks: body.marks ?? existing.marks,
        aiGenerated: body.aiGenerated ?? existing.aiGenerated,
        subject: body.subject!,
        topic: body.topic!,
        text: body.text!,
        options: body.options ?? []
      })
    });
    return json(mapQuestionBankItem(item));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const existing = await prisma.questionBankItem.findUniqueOrThrow({ where: { id: params.id } });
    if (existing.professorId !== user.id) throw new Error("You can only delete your own question bank items.");
    await prisma.questionBankItem.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
