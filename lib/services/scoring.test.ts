import { describe, expect, it } from "vitest";
import { scoreAttempt } from "./scoring";

describe("scoreAttempt", () => {
  it("scores correct, incorrect, and unanswered MCQ answers", () => {
    const result = scoreAttempt(
      [
        { id: "q1", marks: 2, negativeMarks: 0.5, options: [{ id: "a", isCorrect: true }, { id: "b", isCorrect: false }] },
        { id: "q2", marks: 1, negativeMarks: 0, options: [{ id: "c", isCorrect: true }, { id: "d", isCorrect: false }] },
        { id: "q3", marks: 1, negativeMarks: 0, options: [{ id: "e", isCorrect: true }, { id: "f", isCorrect: false }] }
      ],
      [
        { questionId: "q1", selectedOptionIds: ["a"] },
        { questionId: "q2", selectedOptionIds: ["d"], markedForReview: true }
      ]
    );

    expect(result.score).toBe(2);
    expect(result.totalMarks).toBe(4);
    expect(result.percentage).toBe(50);
    expect(result.graded[1].isCorrect).toBe(false);
    expect(result.graded[1].markedForReview).toBe(true);
  });
});
