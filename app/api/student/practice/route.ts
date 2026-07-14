import { prisma } from "@/lib/prisma";
import { errorResponse, json } from "@/lib/http";
import { requireStudent } from "@/lib/serverSession";
import { buildPracticeQuestions } from "@/lib/services/studentLearningService";
import { parseQuestionBankOptions } from "@/lib/questionBank";

export async function GET(request: Request) {
  try {
    await requireStudent(request);
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic")?.trim() || "";
    if (!topic) throw new Error("Practice topic is required.");

    const bankItems = await prisma.questionBankItem.findMany({
      orderBy: { createdAt: "desc" }
    });

    const practiceQuestions = buildPracticeQuestions(topic, bankItems.map((item) => ({
      id: item.id,
      text: item.text,
      explanation: item.explanation,
      subject: item.subject,
      topic: item.topic,
      difficulty: item.difficulty,
      options: parseQuestionBankOptions(item.optionsJson).map((option, index) => ({
        id: `${item.id}-opt-${index}`,
        text: option.text,
        isCorrect: option.isCorrect
      })),
      source: "question-bank" as const
    })));

    return json({
      topic,
      questions: practiceQuestions
    });
  } catch (error) {
    return errorResponse(error);
  }
}
