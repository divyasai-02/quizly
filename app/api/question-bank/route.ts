import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { buildQuestionBankWriteData, mapQuestionBankItem, type QuestionBankInput } from "@/lib/questionBank";
import { requireProfessor } from "@/lib/serverSession";
import { validateQuestionBankItemInput } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const user = requireProfessor(request);
    const items = await prisma.questionBankItem.findMany({
      where: { professorId: user.id },
      orderBy: { createdAt: "desc" }
    });
    return json(items.map(mapQuestionBankItem));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = requireProfessor(request);
    const body = await readJson<QuestionBankInput>(request);
    validateQuestionBankItemInput(body);
    const item = await prisma.questionBankItem.create({
      data: {
        professorId: user.id,
        ...buildQuestionBankWriteData({
          ...body,
          subject: body.subject!,
          topic: body.topic!,
          text: body.text!,
          options: body.options ?? []
        })
      }
    });
    return json(mapQuestionBankItem(item), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
