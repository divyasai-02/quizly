import { QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireProfessor(request);
    const source = await prisma.quiz.findUniqueOrThrow({
      where: { id: params.id },
      include: { questions: { include: { options: { orderBy: { orderIndex: "asc" } } }, orderBy: { orderIndex: "asc" } } }
    });
    if (source.professorId !== user.id) throw new Error("Only the professor who owns this quiz can duplicate it.");

    const quiz = await prisma.quiz.create({
      data: {
        title: `${source.title} (copy)`,
        description: source.description,
        subject: source.subject,
        topic: source.topic,
        difficulty: source.difficulty,
        professorId: user.id,
        classroomId: source.classroomId,
        timeLimitMinutes: source.timeLimitMinutes,
        totalMarks: source.totalMarks,
        passingMarks: source.passingMarks,
        status: QuizStatus.DRAFT,
        aiGenerated: source.aiGenerated,
        aiPrompt: source.aiPrompt,
        questions: {
          create: source.questions.map((question) => ({
            type: question.type,
            text: question.text,
            explanation: question.explanation,
            marks: question.marks,
            negativeMarks: question.negativeMarks,
            timeLimitSeconds: question.timeLimitSeconds,
            required: question.required,
            shuffleOptions: question.shuffleOptions,
            orderIndex: question.orderIndex,
            aiGenerated: question.aiGenerated,
            sourceLabel: question.sourceLabel,
            difficulty: question.difficulty,
            topicTag: question.topicTag,
            options: {
              create: question.options.map((option) => ({
                text: option.text,
                isCorrect: option.isCorrect,
                orderIndex: option.orderIndex
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
