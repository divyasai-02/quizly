import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { questionTypeFromUi } from "@/lib/quizTransforms";
import { validateQuestionInput } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: params.id },
      include: { questions: true }
    });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can add questions.");
    const body = await readJson<{
      type?: string;
      text: string;
      options: string[];
      correct?: number;
      marks?: number;
      negativeMarks?: number;
      minutes?: number;
      seconds?: number;
      required?: boolean;
      shuffle?: boolean;
      explanation?: string;
    }>(request);
    validateQuestionInput(body);

    const question = await prisma.question.create({
      data: {
        quizId: params.id,
        type: questionTypeFromUi(body.type),
        text: body.text,
        explanation: body.explanation,
        marks: body.marks ?? 1,
        negativeMarks: body.negativeMarks ?? 0,
        timeLimitSeconds: ((body.minutes ?? 1) * 60) + (body.seconds ?? 0),
        required: body.required ?? true,
        shuffleOptions: body.shuffle ?? false,
        orderIndex: quiz.questions.length,
        options: {
          create: body.options.map((text, index) => ({
            text,
            orderIndex: index,
            isCorrect: index === (body.correct ?? 0)
          }))
        }
      },
      include: { options: { orderBy: { orderIndex: "asc" } } }
    });
    await prisma.quiz.update({ where: { id: params.id }, data: { totalMarks: { increment: question.marks } } });
    return json(question, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
