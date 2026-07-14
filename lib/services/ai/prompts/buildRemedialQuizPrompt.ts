import type { NormalizedAiQuizGenerationInput } from "@/lib/services/ai/types";

export function buildRemedialQuizPrompt(input: NormalizedAiQuizGenerationInput) {
  const sourceSection = input.materialText
    ? `Uploaded material:\n${input.materialText}`
    : input.pastedNotes
      ? `Weak-topic notes:\n${input.pastedNotes}`
      : "No weak-topic notes or uploaded material supplied.";

  return [
    "You are drafting a short remedial quiz for weaker topics in Quizly.",
    "Return JSON only.",
    "Keep questions supportive, confidence-building, and concept-reinforcing.",
    "Professor review is required before publishing.",
    `Topic: ${input.topic ?? "General"}`,
    `Subject: ${input.subject ?? "General"}`,
    `Question count: ${input.questionCount}`,
    `Difficulty target: ${input.difficulty}`,
    sourceSection
  ].join("\n");
}
