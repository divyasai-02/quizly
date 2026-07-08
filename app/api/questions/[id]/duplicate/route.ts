import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const source = await prisma.question.findUniqueOrThrow({
      where: { id: params.id },
      include: { options: true, quiz: { include: { questions: true } } }
    });
    if (source.quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can duplicate questions.");
    const clone = await prisma.question.create({
      data: {
        quizId: source.quizId,
        type: source.type,
        text: `${source.text} (copy)`,
        explanation: source.explanation,
        marks: source.marks,
        negativeMarks: source.negativeMarks,
        timeLimitSeconds: source.timeLimitSeconds,
        required: source.required,
        shuffleOptions: source.shuffleOptions,
        orderIndex: source.quiz.questions.length,
        aiGenerated: source.aiGenerated,
        difficulty: source.difficulty,
        topicTag: source.topicTag,
        options: {
          create: source.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            orderIndex: option.orderIndex
          }))
        }
      },
      include: { options: { orderBy: { orderIndex: "asc" } } }
    });
    return json(clone, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
