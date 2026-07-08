import { describe, expect, it } from "vitest";
import { isLiveQuiz, quizStatusLabel, quizStatusTone } from "./status";

describe("quiz status helpers", () => {
  it("maps backend statuses to professor-facing labels", () => {
    expect(quizStatusLabel("DRAFT")).toBe("Draft");
    expect(quizStatusLabel("PUBLISHED")).toBe("Live");
    expect(quizStatusLabel("CLOSED")).toBe("Closed");
  });

  it("keeps draft quizzes out of live lists", () => {
    expect(isLiveQuiz("PUBLISHED")).toBe(true);
    expect(isLiveQuiz("DRAFT")).toBe(false);
  });

  it("returns consistent badge tones", () => {
    expect(quizStatusTone("PUBLISHED")).toBe("green");
    expect(quizStatusTone("DRAFT")).toBe("amber");
    expect(quizStatusTone("CLOSED")).toBe("pink");
  });
});
