import type {
  AiProviderExecution,
  AiProviderExplanationPayload,
  AiProviderQuestionImprovementPayload,
  AiProviderQuizDraftPayload,
  AiQuizGenerationInput
} from "@/lib/services/ai/types";

export interface AiProvider {
  name: "mock" | "claude" | "openrouter";
  model: string;
  generateQuizDraft(input: AiQuizGenerationInput): Promise<AiProviderExecution<AiProviderQuizDraftPayload>>;
  regenerateQuestion(input: AiQuizGenerationInput & { questionIndex?: number }): Promise<AiProviderExecution<AiProviderQuizDraftPayload>>;
  improveQuestion(input: { text?: string; tone?: string; userId?: string }): Promise<AiProviderExecution<AiProviderQuestionImprovementPayload>>;
  generateExplanation(input: { question?: string; answer?: string; userId?: string }): Promise<AiProviderExecution<AiProviderExplanationPayload>>;
  generateRemedialQuiz(input: AiQuizGenerationInput): Promise<AiProviderExecution<AiProviderQuizDraftPayload>>;
}
