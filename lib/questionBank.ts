import { QuestionType } from "@prisma/client";
import { prisma } from "./prisma";
import { questionTypeFromUi, questionTypeToUi } from "./quizTransforms";

export type BankOption = {
  text: string;
  isCorrect: boolean;
};

export type QuestionBankInput = {
  subject?: string;
  topic?: string;
  difficulty?: string;
  type?: string;
  text?: string;
  explanation?: string;
  marks?: number;
  options?: BankOption[];
  aiGenerated?: boolean;
};

export function buildQuestionBankWriteData(input: Required<Pick<QuestionBankInput, "subject" | "topic" | "text" | "options">> & QuestionBankInput) {
  return {
    subject: input.subject.trim(),
    topic: input.topic.trim(),
    difficulty: input.difficulty ?? "Easy",
    type: normalizeBankType(input.type),
    text: input.text.trim(),
    explanation: input.explanation?.trim() || null,
    marks: input.marks ?? 1,
    optionsJson: serializeQuestionBankOptions(input.options),
    aiGenerated: input.aiGenerated ?? false
  };
}

export function buildDuplicateQuestionBankItemData(item: {
  subject: string;
  topic: string;
  difficulty: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  marks: number;
  optionsJson: string;
  aiGenerated: boolean;
}, professorId: string) {
  return {
    professorId,
    subject: item.subject,
    topic: item.topic,
    difficulty: item.difficulty,
    type: item.type,
    text: `${item.text} (copy)`,
    explanation: item.explanation,
    marks: item.marks,
    optionsJson: item.optionsJson,
    aiGenerated: item.aiGenerated
  };
}

export function normalizeBankType(type?: string) {
  if (!type) return QuestionType.MCQ_SINGLE;
  if (type in QuestionType) return type as QuestionType;
  return questionTypeFromUi(type) as QuestionType;
}

export function parseQuestionBankOptions(optionsJson: string) {
  const parsed = JSON.parse(optionsJson) as Array<string | BankOption>;
  return parsed.map((option) =>
    typeof option === "string"
      ? { text: option, isCorrect: false }
      : { text: option.text, isCorrect: !!option.isCorrect }
  );
}

export function serializeQuestionBankOptions(options: BankOption[]) {
  return JSON.stringify(options.map((option) => ({ text: option.text, isCorrect: option.isCorrect })));
}

export function mapQuestionBankItem(item: {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  marks: number;
  optionsJson: string;
  aiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const options = parseQuestionBankOptions(item.optionsJson);
  return {
    id: item.id,
    subject: item.subject,
    topic: item.topic,
    difficulty: item.difficulty,
    type: item.type,
    typeLabel: questionTypeToUi(item.type),
    text: item.text,
    explanation: item.explanation ?? "",
    marks: item.marks,
    options,
    aiGenerated: item.aiGenerated,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    createdLabel: item.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  };
}

export async function addQuestionBankItemToQuiz(questionBankItemId: string, quizId: string, professorId: string) {
  const [item, quiz] = await Promise.all([
    prisma.questionBankItem.findUniqueOrThrow({ where: { id: questionBankItemId } }),
    prisma.quiz.findUniqueOrThrow({ where: { id: quizId }, include: { questions: true } })
  ]);

  if (item.professorId !== professorId) throw new Error("You can only use your own question bank items.");
  if (quiz.professorId !== professorId) throw new Error("You can only add questions to your own quizzes.");
  if (quiz.status !== "DRAFT") throw new Error("Questions can only be added to draft quizzes.");

  const created = await prisma.question.create({
    data: buildQuestionFromBankItem(item, quizId, quiz.questions.length),
    include: { options: { orderBy: { orderIndex: "asc" } } }
  });

  await prisma.quiz.update({
    where: { id: quizId },
    data: { totalMarks: { increment: item.marks } }
  });

  return created;
}

export function buildQuestionFromBankItem(item: {
  type: QuestionType;
  text: string;
  explanation: string | null;
  marks: number;
  aiGenerated: boolean;
  difficulty: string;
  topic: string;
  optionsJson: string;
}, quizId: string, orderIndex: number) {
  const options = parseQuestionBankOptions(item.optionsJson);
  return {
    quizId,
    type: item.type,
    text: item.text,
    explanation: item.explanation,
    marks: item.marks,
    negativeMarks: 0,
    timeLimitSeconds: 60,
    required: true,
    shuffleOptions: false,
    orderIndex,
    aiGenerated: item.aiGenerated,
    sourceLabel: item.aiGenerated ? "AI Drafted" : "Question Bank",
    difficulty: item.difficulty,
    topicTag: item.topic,
    options: {
      create: options.map((option, index) => ({
        text: option.text,
        isCorrect: option.isCorrect,
        orderIndex: index
      }))
    }
  };
}
