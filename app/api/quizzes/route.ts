import { QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { mapQuizDetail, mapQuizSummary, quizInclude, questionTypeFromUi } from "@/lib/quizTransforms";
import { validateQuestionInput, validateQuizTitle } from "@/lib/validation";

type QuestionPayload = {
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
};

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const quizzes = await prisma.quiz.findMany({
      where: { professorId: user.id },
      include: quizInclude,
      orderBy: { createdAt: "desc" }
    });
    return json(quizzes.map(mapQuizSummary));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProfessor(request);
    const body = await readJson<{
      title?: string;
      description?: string;
      subject?: string;
      topic?: string;
      difficulty?: string;
      classroomId?: string;
      timeLimitMinutes?: number;
      passingMarks?: number;
      aiGenerated?: boolean;
      aiPrompt?: string;
      questions?: QuestionPayload[];
    }>(request);
    const questions = body.questions ?? [];
    validateQuizTitle(body.title ?? "Untitled Quiz");
    questions.forEach(validateQuestionInput);

    const quiz = await prisma.quiz.create({
      data: {
        title: body.title ?? "Untitled Quiz",
        description: body.description ?? "Draft quiz created in Quizly.",
        subject: body.subject ?? "Computer Science",
        topic: body.topic ?? "General",
        difficulty: body.difficulty ?? "Easy",
        professorId: user.id,
        classroomId: body.classroomId,
        timeLimitMinutes: body.timeLimitMinutes ?? Math.max(1, questions.reduce((sum, question) => sum + (question.minutes ?? 1), 0)),
        totalMarks: questions.reduce((sum, question) => sum + (question.marks ?? 1), 0),
        passingMarks: body.passingMarks ?? Math.ceil(questions.length / 2),
        status: QuizStatus.DRAFT,
        aiGenerated: body.aiGenerated ?? false,
        aiPrompt: body.aiPrompt,
        questions: {
          create: questions.map((question, orderIndex) => ({
            type: questionTypeFromUi(question.type),
            text: question.text,
            explanation: question.explanation,
            marks: question.marks ?? 1,
            negativeMarks: question.negativeMarks ?? 0,
            timeLimitSeconds: ((question.minutes ?? 1) * 60) + (question.seconds ?? 0),
            required: question.required ?? true,
            shuffleOptions: question.shuffle ?? false,
            orderIndex,
            sourceLabel: question.sourceLabel ?? "Manual",
            options: {
              create: (question.options ?? []).map((text, index) => ({
                text,
                orderIndex: index,
                isCorrect: (question.correctAnswers?.length ? question.correctAnswers : [question.correct ?? 0]).includes(index)
              }))
            }
          }))
        }
      },
      include: quizInclude
    });

    return json(mapQuizDetail(quiz), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
