import { QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { buildTemplateQuizData, getTemplateById } from "@/lib/templates";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireProfessor(request);
    const template = getTemplateById(params.id);
    if (!template) throw new Error("Template not found.");

    const quiz = await prisma.quiz.create({
      data: {
        ...buildTemplateQuizData(template, user.id),
        status: QuizStatus.DRAFT
      }
    });

    return json({ id: quiz.id, redirectTo: `/professor/quizzes/${quiz.id}/edit` }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
