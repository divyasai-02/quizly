import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { mapQuizDetail, quizInclude } from "@/lib/quizTransforms";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id }, include: quizInclude });
    return json(mapQuizDetail(quiz));
  } catch (error) {
    return errorResponse(error);
  }
}
