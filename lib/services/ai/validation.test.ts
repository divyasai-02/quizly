import { describe, expect, it } from "vitest";
import { sanitizeAiQuizGenerationInput, validateQuizDraftPayload } from "@/lib/services/ai/validation";

describe("validateQuizDraftPayload", () => {
  it("accepts valid MCQ output and normalizes correct answers", () => {
    const { normalized } = sanitizeAiQuizGenerationInput({
      mode: "quiz-builder",
      topic: "Closures",
      difficulty: "Medium",
      questionCount: 1,
      questionTypes: ["MCQ Single"]
    });

    const payload = validateQuizDraftPayload({
      questions: [
        {
          type: "MCQ Single",
          text: "What does a closure preserve?",
          options: ["Function scope", "Only global state", "Rendered JSX", "HTTP headers"],
          correctOptionIndexes: [0],
          explanation: "Closures retain access to the lexical scope where they were created.",
          difficulty: "Medium",
          confidence: 82
        }
      ]
    }, normalized);

    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0].correctOptionIds).toHaveLength(1);
    expect(payload.questions[0].confidence).toBe(0.82);
  });

  it("discards invalid MCQ output with a warning instead of inserting it", () => {
    const { normalized } = sanitizeAiQuizGenerationInput({
      mode: "quiz-builder",
      topic: "Closures",
      difficulty: "Medium",
      questionCount: 2,
      questionTypes: ["MCQ Single", "Short Answer"]
    });

    const payload = validateQuizDraftPayload({
      questions: [
        {
          type: "MCQ Single",
          text: "Broken question",
          options: ["Only one option"],
          explanation: "This should be discarded."
        },
        {
          type: "Short Answer",
          text: "Define lexical scope.",
          correctAnswer: "It is the scope determined by where code is written.",
          explanation: "Lexical scope is resolved from the source structure."
        }
      ]
    }, normalized);

    expect(payload.questions).toHaveLength(1);
    expect(payload.warnings.some((warning) => warning.includes("Discarded AI question 1"))).toBe(true);
  });

  it("normalizes mixed difficulty questions to a concrete quiz question difficulty", () => {
    const { normalized } = sanitizeAiQuizGenerationInput({
      mode: "quiz-builder",
      topic: "Normalization",
      difficulty: "Mixed",
      questionCount: 1,
      questionTypes: ["Short Answer"]
    });

    const payload = validateQuizDraftPayload({
      questions: [
        {
          type: "Short Answer",
          text: "Define second normal form.",
          correctAnswer: "2NF removes partial dependencies.",
          explanation: "It builds on 1NF by removing partial dependencies.",
          difficulty: "Mixed"
        }
      ]
    }, normalized);

    expect(payload.questions[0].difficulty).toBe("Medium");
  });
});
