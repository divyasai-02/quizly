export function buildQuestionImprovementPrompt(input: { text: string; tone: string }) {
  return [
    "You improve a professor-authored question for clarity without changing its learning objective.",
    "Return JSON only with { text, rationale, warnings }.",
    `Tone target: ${input.tone}`,
    `Original question: ${input.text}`
  ].join("\n");
}
