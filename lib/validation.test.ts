import { describe, expect, it } from "vitest";
import { validatePublish, validateQuestionInput, validateQuizTitle } from "./validation";

describe("validation", () => {
  it("requires quiz title", () => {
    expect(() => validateQuizTitle("")).toThrow("Quiz title is required.");
  });

  it("requires MCQ options and a correct answer", () => {
    expect(() => validateQuestionInput({ text: "Pick one", options: ["A"], correct: 0 })).toThrow("MCQ questions must have at least two options.");
    expect(() => validateQuestionInput({ text: "Pick one", options: ["A", "B"], correct: 3 })).toThrow("MCQ questions must have at least one correct option.");
  });

  it("prevents publishing empty quizzes", () => {
    expect(() => validatePublish([])).toThrow("Add at least one question before publishing.");
  });
});
