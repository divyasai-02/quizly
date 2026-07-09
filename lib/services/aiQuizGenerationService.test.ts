import { beforeEach, describe, expect, it, vi } from "vitest";

const { createInsight } = vi.hoisted(() => ({
  createInsight: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    aIInsight: {
      create: createInsight
    }
  }
}));

import {
  generateExplanation,
  generateQuizDraft,
  mapAiDraftToQuestionBankItem,
  mapAiDraftToQuizQuestion,
  regenerateQuestion
} from "./aiQuizGenerationService";

describe("aiQuizGenerationService", () => {
  beforeEach(() => {
    createInsight.mockReset();
    createInsight.mockResolvedValue({});
  });

  it("returns valid structured questions for quiz generation", async () => {
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      topic: "JavaScript closures and hoisting",
      questionCount: 4,
      questionTypes: ["MCQ Single", "MCQ Multiple", "True/False", "Short Answer"]
    });

    expect(output.questions).toHaveLength(4);
    expect(output.summary).toContain("Drafted");
    expect(output.questions[0].aiGenerated).toBe(true);
  });

  it("returns warnings and lower confidence for thin notes input", async () => {
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      pastedNotes: "closures scope callbacks",
      questionCount: 2,
      questionTypes: ["MCQ Single"]
    });

    expect(output.warnings.some((warning) => warning.includes("short"))).toBe(true);
    expect(output.questions.every((question) => question.confidence < 0.8)).toBe(true);
  });

  it("ensures generated MCQs have options and correct answers", async () => {
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      topic: "DBMS and SQL joins",
      questionCount: 3,
      questionTypes: ["MCQ Single", "MCQ Multiple", "True/False"]
    });

    output.questions.forEach((question) => {
      expect(question.options.length).toBeGreaterThan(0);
      expect(question.correctOptionIds?.length).toBeGreaterThan(0);
    });
  });

  it("maps generated questions to question bank and quiz builder payloads", async () => {
    const draft = await regenerateQuestion({
      mode: "quiz-builder",
      topic: "Computer networks",
      questionIndex: 0
    });

    const bankItem = mapAiDraftToQuestionBankItem(draft, { subject: "Networks", topic: draft.topicTag, difficulty: draft.difficulty });
    const quizQuestion = mapAiDraftToQuizQuestion(draft);

    expect(bankItem.aiGenerated).toBe(true);
    expect(bankItem.options.some((option) => option.isCorrect)).toBe(true);
    expect(quizQuestion.sourceLabel).toBe("AI Drafted");
  });

  it("generates explanations with contextual answer text", async () => {
    const response = await generateExplanation({
      question: "What is SQL?",
      answer: "Structured Query Language"
    });

    expect(response.explanation).toContain("Structured Query Language");
  });
});
