import { AIInsightType } from "@prisma/client";
import { buildMockExplanation, buildMockQuestionImprovement, buildMockQuizPayload } from "@/lib/services/ai/mockQuizGenerator";
import { sanitizeAiQuizGenerationInput } from "@/lib/services/ai/validation";
import type { AiProvider } from "@/lib/services/ai/providers/aiProvider";
import type { AiProviderExecution, AiProviderExplanationPayload, AiProviderQuestionImprovementPayload, AiProviderQuizDraftPayload, AiQuizGenerationInput } from "@/lib/services/ai/types";

const MODEL = "quizly-mock-v2";

function execution<T>(data: T, warnings: string[] = []): AiProviderExecution<T> {
  return {
    data,
    provider: {
      provider: "mock",
      model: MODEL,
      warnings
    }
  };
}

export class MockAiProvider implements AiProvider {
  name = "mock" as const;
  model = MODEL;

  async generateQuizDraft(input: AiQuizGenerationInput) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput(input);
    const payload = buildMockQuizPayload(normalized, AIInsightType.QUIZ_GENERATION);
    return execution<AiProviderQuizDraftPayload>({
      ...payload,
      warnings: [...(payload.warnings ?? []), ...warnings]
    });
  }

  async generateRemedialQuiz(input: AiQuizGenerationInput) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput({
      ...input,
      mode: "analytics-remedial",
      difficulty: input.difficulty ?? "Easy",
      questionCount: input.questionCount ?? 5,
      tone: input.tone ?? "Exam-focused"
    });
    const payload = buildMockQuizPayload(normalized, AIInsightType.REMEDIAL_GENERATION);
    return execution<AiProviderQuizDraftPayload>({
      ...payload,
      warnings: [...(payload.warnings ?? []), ...warnings]
    });
  }

  async regenerateQuestion(input: AiQuizGenerationInput & { questionIndex?: number }) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput({
      ...input,
      questionCount: Math.max(1, (input.questionIndex ?? 0) + 1)
    });
    const payload = buildMockQuizPayload(normalized, AIInsightType.QUESTION_REGENERATION);
    return execution<AiProviderQuizDraftPayload>({
      ...payload,
      warnings: [...(payload.warnings ?? []), ...warnings]
    });
  }

  async improveQuestion(input: { text?: string; tone?: string; userId?: string }) {
    return execution<AiProviderQuestionImprovementPayload>(buildMockQuestionImprovement(input));
  }

  async generateExplanation(input: { question?: string; answer?: string; userId?: string }) {
    return execution<AiProviderExplanationPayload>(buildMockExplanation(input));
  }
}
