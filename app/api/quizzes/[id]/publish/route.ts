import { QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";
import { validatePublish } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({
      where: { id: params.id },
      include: { questions: { include: { options: true } } }
    });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can publish it.");
    validatePublish(quiz.questions);
    const updated = await prisma.quiz.update({
      where: { id: params.id },
      data: { status: QuizStatus.PUBLISHED, publishedAt: new Date() },
      include: quizInclude
    });
    return json(mapQuizDetail(updated));
  } catch (error) {
    return errorResponse(error);
  }
}
