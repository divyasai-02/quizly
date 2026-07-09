import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { questionTypeFromUi } from "@/lib/quizTransforms";
import { validateQuestionInput } from "@/lib/validation";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = requireProfessor(request);
    const existing = await prisma.question.findUniqueOrThrow({
      where: { id: params.id },
      include: { quiz: true }
    });
    if (existing.quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can edit questions.");
    const body = await readJson<{
      type?: string;
      text: string;
      options: string[];
      correct?: number;
      correctAnswers?: number[];
      marks?: number;
      negativeMarks?: number;
      minutes?: number;
      seconds?: number;
      required?: boolean;
      shuffle?: boolean;
      explanation?: string;
    }>(request);
    validateQuestionInput(body);
    await prisma.questionOption.deleteMany({ where: { questionId: params.id } });
    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        type: questionTypeFromUi(body.type),
        text: body.text,
        explanation: body.explanation,
        marks: body.marks ?? 1,
        negativeMarks: body.negativeMarks ?? 0,
        timeLimitSeconds: ((body.minutes ?? 1) * 60) + (body.seconds ?? 0),
        required: body.required ?? true,
        shuffleOptions: body.shuffle ?? false,
        options: {
          create: body.options.map((text, index) => ({
            text,
            orderIndex: index,
            isCorrect: (body.correctAnswers?.length ? body.correctAnswers : [body.correct ?? 0]).includes(index)
          }))
        }
      },
      include: { options: { orderBy: { orderIndex: "asc" } } }
    });
    return json(question);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = requireProfessor(request);
    const existing = await prisma.question.findUniqueOrThrow({ where: { id: params.id }, include: { quiz: true } });
    if (existing.quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can delete questions.");
    await prisma.question.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
