import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireServerUser } from "@/lib/serverSession";
import { mapQuizForStudent, quizInclude } from "@/lib/quizTransforms";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireServerUser(request);
    const quiz = await prisma.quiz.findUniqueOrThrow({ where: { id: params.id }, include: quizInclude });
    return json(mapQuizForStudent(quiz));
  } catch (error) {
    return errorResponse(error);
  }
}
