import type { NormalizedAiQuizGenerationInput } from "@/lib/services/ai/types";

export function buildQuestionRegenerationPrompt(input: NormalizedAiQuizGenerationInput & { questionIndex?: number }) {
  const sourceSection = input.materialText
    ? `Use this uploaded material carefully:\n${input.materialText}`
    : input.pastedNotes
      ? `Use these notes carefully:\n${input.pastedNotes}`
      : "No notes or uploaded material supplied.";

  return [
    buildSharedRegenerationPrefix(),
    `Regenerate question number ${(input.questionIndex ?? 0) + 1} as a fresh alternative.`,
    `Topic: ${input.topic ?? "General"}`,
    `Difficulty target: ${input.difficulty}`,
    `Question types allowed: ${input.questionTypes.join(", ")}`,
    sourceSection
  ].join("\n");
}

function buildSharedRegenerationPrefix() {
  return [
    "You are regenerating one professor-review quiz question for Quizly.",
    "Return JSON only with the same question contract as Quizly quiz generation.",
    "Do not include markdown.",
    "Include warnings if the topic context is thin."
  ].join("\n");
}
