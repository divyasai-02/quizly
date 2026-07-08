import { QuestionType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildDuplicateQuestionBankItemData, buildQuestionBankWriteData, buildQuestionFromBankItem, parseQuestionBankOptions } from "./questionBank";
import { validateQuestionBankItemInput } from "./validation";

describe("question bank helpers", () => {
  it("validates required question bank fields", () => {
    expect(() => validateQuestionBankItemInput({ text: "", subject: "Java", topic: "OOP", options: [] })).toThrow("Question text is required.");
    expect(() => validateQuestionBankItemInput({ text: "What is JVM?", subject: "", topic: "OOP", options: [] })).toThrow("Subject is required.");
    expect(() => validateQuestionBankItemInput({ text: "What is JVM?", subject: "Java", topic: "", options: [] })).toThrow("Topic is required.");
  });

  it("builds create and update payloads with normalized values", () => {
    const data = buildQuestionBankWriteData({
      text: " What is JVM? ",
      subject: " Java ",
      topic: " Runtime ",
      difficulty: "Medium",
      type: "MCQ_SINGLE",
      marks: 2,
      options: [{ text: "Java Virtual Machine", isCorrect: true }, { text: "Java Vendor Mode", isCorrect: false }]
    });
    expect(data.subject).toBe("Java");
    expect(data.topic).toBe("Runtime");
    expect(data.marks).toBe(2);
    expect(parseQuestionBankOptions(data.optionsJson)[0]).toMatchObject({ text: "Java Virtual Machine", isCorrect: true });
  });

  it("builds duplicate question bank item data", () => {
    const clone = buildDuplicateQuestionBankItemData({
      subject: "DBMS",
      topic: "SQL",
      difficulty: "Easy",
      type: QuestionType.MCQ_SINGLE,
      text: "What is SQL?",
      explanation: "Structured Query Language",
      marks: 1,
      optionsJson: "[]",
      aiGenerated: false
    }, "prof-john");
    expect(clone.professorId).toBe("prof-john");
    expect(clone.text).toContain("(copy)");
  });

  it("builds a quiz question from a bank item for add-to-quiz", () => {
    const question = buildQuestionFromBankItem({
      type: QuestionType.MCQ_SINGLE,
      text: "Which clause sorts rows?",
      explanation: "ORDER BY sorts rows.",
      marks: 1,
      aiGenerated: false,
      difficulty: "Easy",
      topic: "SQL",
      optionsJson: JSON.stringify([{ text: "ORDER BY", isCorrect: true }, { text: "GROUP BY", isCorrect: false }])
    }, "quiz-1", 3);
    expect(question.quizId).toBe("quiz-1");
    expect(question.orderIndex).toBe(3);
    expect(question.sourceLabel).toBe("Question Bank");
    expect(question.options.create[0]).toMatchObject({ text: "ORDER BY", isCorrect: true });
  });
});
