import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { mapQuizDetail, quizInclude, questionTypeFromUi } from "@/lib/quizTransforms";
import { validateQuestionInput, validateQuizTitle } from "@/lib/validation";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id }, include: quizInclude });
    return json(mapQuizDetail(quiz));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const user = requireProfessor(request);
    const body = await readJson<{
      title?: string;
      description?: string;
      subject?: string;
      topic?: string;
      difficulty?: string;
      timeLimitMinutes?: number;
      passingMarks?: number;
      questions?: Array<{
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
        sourceLabel?: string;
      }>;
    }>(request);
    const existing = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id } });
    if (existing.professorId !== user.id) throw new Error("Only the professor who owns this quiz can edit it.");
    validateQuizTitle(body.title ?? existing.title);
    body.questions?.forEach(validateQuestionInput);

    const quiz = await prisma.$transaction(async (tx) => {
      if (body.questions) {
        await tx.question.deleteMany({ where: { quizId: params.id } });
      }
      return tx.quiz.update({
        where: { id: params.id },
        data: {
          title: body.title ?? existing.title,
          description: body.description ?? existing.description,
          subject: body.subject ?? existing.subject,
          topic: body.topic ?? existing.topic,
          difficulty: body.difficulty ?? existing.difficulty,
          timeLimitMinutes: body.timeLimitMinutes ?? existing.timeLimitMinutes,
          passingMarks: body.passingMarks ?? existing.passingMarks,
          totalMarks: body.questions?.reduce((sum, question) => sum + (question.marks ?? 1), 0) ?? existing.totalMarks,
          questions: body.questions
            ? {
                create: body.questions.map((question, orderIndex) => ({
                  type: questionTypeFromUi(question.type),
                  text: question.text,
                  explanation: question.explanation,
                  marks: question.marks ?? 1,
                  negativeMarks: question.negativeMarks ?? 0,
                  timeLimitSeconds: ((question.minutes ?? 1) * 60) + (question.seconds ?? 0),
                  required: question.required ?? true,
                  shuffleOptions: question.shuffle ?? false,
                  orderIndex,
                  sourceLabel: (question as { sourceLabel?: string }).sourceLabel ?? "Manual",
                  options: {
                    create: question.options.map((text, index) => ({
                      text,
                      orderIndex: index,
                      isCorrect: (question.correctAnswers?.length ? question.correctAnswers : [question.correct ?? 0]).includes(index)
                    }))
                  }
                }))
              }
            : undefined
        },
        include: quizInclude
      });
    });

    return json(mapQuizDetail(quiz));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id } });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can delete it.");
    await prisma.quiz.delete({ where: { id: params.id } });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
