import type { NormalizedAiQuizGenerationInput } from "@/lib/services/ai/types";

export function buildQuizGenerationPrompt(input: NormalizedAiQuizGenerationInput) {
  const sourceSection = input.materialText
    ? `Uploaded material (${input.materialMetadata?.fileName ?? "unnamed file"}):\n${input.materialText}`
    : input.pastedNotes
      ? `Pasted notes:\n${input.pastedNotes}`
      : "No notes or uploaded material were provided.";

  return [
    "You are Quizly's educational quiz drafting assistant.",
    "Return JSON only. Do not return markdown, prose outside JSON, or code fences.",
    "The professor must review all content before publishing.",
    "Generate age-appropriate, educationally appropriate classroom questions.",
    "If source material is thin, include warnings.",
    "Avoid hallucinating unsupported specifics from pasted notes.",
    "Respect requested question count, difficulty, tone, Bloom level, and question types.",
    "Every question must include explanation, difficulty, topicTag, marks, confidence, source, and aiGenerated true.",
    "JSON shape: { summary, warnings, coverage, estimatedDifficulty, suggestedTimeMinutes, questions }",
    "Each question JSON shape: { type, text, options, correctOptionIndexes, correctAnswer, explanation, difficulty, topicTag, marks, confidence, source, aiGenerated }",
    `Mode: ${input.mode}`,
    `Subject: ${input.subject ?? "General"}`,
    `Topic: ${input.topic ?? "Not provided"}`,
    `Question count: ${input.questionCount}`,
    `Question types: ${input.questionTypes.join(", ")}`,
    `Difficulty: ${input.difficulty}`,
    `Bloom level: ${input.bloomLevel}`,
    `Marks per question: ${input.marksPerQuestion}`,
    `Tone: ${input.tone}`,
    `Negative marking enabled: ${input.negativeMarking ? "yes" : "no"}`,
    sourceSection
  ].join("\n");
}
