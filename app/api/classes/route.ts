import { prisma } from "@/lib/prisma";
import { errorResponse, json, readJson } from "@/lib/http";
import { requireProfessor } from "@/lib/serverSession";

export async function GET(request: Request) {
  try {
    const user = await requireProfessor(request);
    const classes = await prisma.classroom.findMany({
      where: { professorId: user.id },
      include: { students: true, quizzes: true },
      orderBy: { createdAt: "asc" }
    });
    return json(classes.map((item) => ({
      id: item.id,
      code: item.name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase(),
      name: item.name,
      subject: item.subject,
      section: item.section,
      students: item.students.length,
      quizzes: item.quizzes.length,
      joinCode: item.joinCode,
      activity: "Recently"
    })));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProfessor(request);
    const body = await readJson<{ name?: string; subject?: string; section?: string }>(request);
    if (!body.name?.trim()) throw new Error("Class name is required.");
    const classroom = await prisma.classroom.create({
      data: {
        name: body.name,
        subject: body.subject ?? "Computer Science",
        section: body.section,
        joinCode: `QZ${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        professorId: user.id
      }
    });
    return json(classroom, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
