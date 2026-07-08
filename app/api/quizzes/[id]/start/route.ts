import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = requireStudent(request);
    const existing = await prisma.quizAttempt.findFirst({
      where: { quizId: params.id, studentId: user.id, status: "IN_PROGRESS" }
    });
    const attempt = existing ?? await prisma.quizAttempt.create({ data: { quizId: params.id, studentId: user.id } });
    return json(attempt, { status: existing ? 200 : 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
