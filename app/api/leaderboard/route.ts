import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";

export async function GET() {
  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
      include: { student: true },
      orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }]
    });

    const byStudent = new Map<string, { name: string; xp: number; attempts: number; accuracy: number; initials: string }>();
    for (const attempt of attempts) {
      const current = byStudent.get(attempt.studentId) ?? {
        name: attempt.student.name,
        xp: 0,
        attempts: 0,
        accuracy: 0,
        initials: attempt.student.name.split(" ").map((part) => part[0]).join("").slice(0, 2)
      };
      current.xp += Math.round(attempt.score * 100);
      current.attempts += 1;
      current.accuracy += attempt.percentage;
      byStudent.set(attempt.studentId, current);
    }

    const learners = [...byStudent.values()]
      .map((learner, index) => ({
        rank: index + 1,
        name: learner.name,
        tag: index === 0 ? "Code Master" : index === 1 ? "Logic Legend" : "Quick Thinker",
        className: "CSE - A",
        xp: learner.xp,
        accuracy: Math.round(learner.accuracy / Math.max(1, learner.attempts)),
        streak: Math.max(3, 14 - index),
        initials: learner.initials,
        current: learner.name === "Arjun Mehta"
      }))
      .sort((a, b) => b.xp - a.xp)
      .map((learner, index) => ({ ...learner, rank: index + 1 }));

    return json({ learners });
  } catch (error) {
    return errorResponse(error);
  }
}
