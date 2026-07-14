import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireStudent(request);
    const attempt = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`quiz-start:${params.id}:${user.id}`}))`;
      const existingAttempts = await tx.quizAttempt.findMany({
        where: { quizId: params.id, studentId: user.id, status: "IN_PROGRESS" },
        include: {
          _count: {
            select: { answers: true }
          }
        },
        orderBy: { updatedAt: "desc" }
      });

      const existing = existingAttempts[0] ?? null;
      const staleAttempts = existingAttempts.slice(1);

      if (staleAttempts.length) {
        await tx.quizAttempt.deleteMany({
          where: {
            id: { in: staleAttempts.map((attempt) => attempt.id) }
          }
        });
      }

      const isResumable = existing
        ? existing._count.answers > 0 || (Date.now() - existing.updatedAt.getTime()) < 1000 * 60 * 60 * 6
        : false;

      if (existing && isResumable) {
        return { attempt: existing, status: 200 };
      }

      if (existing && !isResumable) {
        await tx.quizAttempt.delete({ where: { id: existing.id } });
      }

      const created = await tx.quizAttempt.create({ data: { quizId: params.id, studentId: user.id } });
      return { attempt: created, status: 201 };
    });
    return json(attempt.attempt, { status: attempt.status });
  } catch (error) {
    return errorResponse(error);
  }
}
