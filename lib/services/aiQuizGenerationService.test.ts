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
    process.env.AI_PROVIDER = "mock";
    delete process.env.OPENROUTER_API_KEY;
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
    expect(output.provider.provider).toBe("mock");
    expect(output.provider.usedFallback).toBe(false);
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

  it("uses uploaded material as the generated question source", async () => {
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      materialText: "SQL joins combine related rows. Normalization reduces redundancy in tables.",
      materialMetadata: {
        materialId: "material-1",
        fileName: "sql-notes.txt",
        fileType: "text/plain",
        fileSize: 128,
        extractedCharCount: 74,
        parser: "txt",
        confidence: "medium",
        previewText: "SQL joins combine related rows. Normalization reduces redundancy in tables."
      },
      questionCount: 2,
      questionTypes: ["MCQ Single"]
    });

    expect(output.questions.every((question) => question.source === "Based on uploaded material")).toBe(true);
    expect(createInsight).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        inputJson: expect.stringContaining("\"materialMetadata\"")
      })
    }));
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
    expect(response.provider.provider).toBe("mock");
  });

  it("falls back safely when Claude is requested without credentials", async () => {
    const previousProvider = process.env.AI_PROVIDER;
    const previousKey = process.env.ANTHROPIC_API_KEY;

    try {
      process.env.AI_PROVIDER = "claude";
      delete process.env.ANTHROPIC_API_KEY;

      const output = await generateQuizDraft({
        mode: "quiz-builder",
        topic: "Operating systems scheduling",
        questionCount: 2,
        questionTypes: ["MCQ Single"]
      });

      expect(output.provider.provider).toBe("mock");
      expect(output.provider.usedFallback).toBe(false);
      expect(output.warnings.some((warning) => warning.includes("ANTHROPIC_API_KEY"))).toBe(true);
    } finally {
      if (previousProvider === undefined) {
        delete process.env.AI_PROVIDER;
      } else {
        process.env.AI_PROVIDER = previousProvider;
      }

      if (previousKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = previousKey;
      }
    }
  });

  it("falls back safely for explanation generation when Claude is unavailable", async () => {
    const previousProvider = process.env.AI_PROVIDER;
    const previousKey = process.env.ANTHROPIC_API_KEY;

    try {
      process.env.AI_PROVIDER = "claude";
      delete process.env.ANTHROPIC_API_KEY;

      const response = await generateExplanation({
        question: "What is normalization?",
        answer: "A database design process."
      });

      expect(response.provider.provider).toBe("mock");
      expect(response.warnings.some((warning) => warning.includes("ANTHROPIC_API_KEY"))).toBe(true);
      expect(JSON.stringify(response)).not.toContain("ANTHROPIC_API_KEY=");
      expect(JSON.stringify(response)).not.toContain("sk-");
    } finally {
      if (previousProvider === undefined) {
        delete process.env.AI_PROVIDER;
      } else {
        process.env.AI_PROVIDER = previousProvider;
      }

      if (previousKey === undefined) {
        delete process.env.ANTHROPIC_API_KEY;
      } else {
        process.env.ANTHROPIC_API_KEY = previousKey;
      }
    }
  });
});
