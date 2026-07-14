export function buildExplanationPrompt(input: { question: string; answer?: string }) {
  return [
    "You write short, classroom-safe answer explanations for Quizly.",
    "Return JSON only with { explanation, warnings }.",
    "Keep the explanation concise, educational, and professor-review friendly.",
    `Question: ${input.question}`,
    `Expected answer: ${input.answer ?? "Not supplied"}`
  ].join("\n");
}
