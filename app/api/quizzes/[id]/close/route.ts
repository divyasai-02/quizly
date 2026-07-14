import { QuizStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireProfessor(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id } });
    if (quiz.professorId !== user.id) throw new Error("Only the professor who owns this quiz can close it.");
    return json(await prisma.quiz.update({ where: { id: params.id }, data: { status: QuizStatus.CLOSED } }));
  } catch (error) {
    return errorResponse(error);
  }
}
