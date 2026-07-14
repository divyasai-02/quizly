import { buildExplanationPrompt } from "@/lib/services/ai/prompts/buildExplanationPrompt";
import { buildQuestionImprovementPrompt } from "@/lib/services/ai/prompts/buildQuestionImprovementPrompt";
import { buildQuestionRegenerationPrompt } from "@/lib/services/ai/prompts/buildQuestionRegenerationPrompt";
import { buildQuizGenerationPrompt } from "@/lib/services/ai/prompts/buildQuizGenerationPrompt";
import { buildRemedialQuizPrompt } from "@/lib/services/ai/prompts/buildRemedialQuizPrompt";
import { sanitizeAiQuizGenerationInput } from "@/lib/services/ai/validation";
import type { AiProvider } from "@/lib/services/ai/providers/aiProvider";
import type { AiProviderExecution, AiProviderExplanationPayload, AiProviderQuestionImprovementPayload, AiProviderQuizDraftPayload, AiQuizGenerationInput } from "@/lib/services/ai/types";

const API_URL = "https://api.anthropic.com/v1/messages";
const REQUEST_TIMEOUT_MS = 20000;

function warningsArray(value: unknown) {
  return Array.isArray(value) ? value.filter((warning): warning is string => typeof warning === "string") : typeof value === "string" ? [value] : [];
}

function extractJson(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
    }
    throw new Error("Claude returned invalid JSON.");
  }
}

async function callClaude<T>(prompt: string, apiKey: string, model: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 3500,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Claude request failed with status ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
    }

    const body = await response.json() as { content?: Array<{ type?: string; text?: string }>; };
    const text = body.content?.find((item) => item.type === "text")?.text;
    if (!text) {
      throw new Error("Claude response did not include text content.");
    }
    return extractJson(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export class ClaudeAiProvider implements AiProvider {
  name = "claude" as const;
  model: string;
  private apiKey: string;

  constructor(options: { apiKey: string; model: string }) {
    this.apiKey = options.apiKey;
    this.model = options.model;
  }

  async generateQuizDraft(input: AiQuizGenerationInput) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput(input);
    const data = await callClaude<AiProviderQuizDraftPayload>(buildQuizGenerationPrompt(normalized), this.apiKey, this.model);
    return this.wrap({ ...data, warnings: [...warningsArray(data.warnings), ...warnings] });
  }

  async generateRemedialQuiz(input: AiQuizGenerationInput) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput({
      ...input,
      mode: "analytics-remedial",
      difficulty: input.difficulty ?? "Easy",
      questionCount: input.questionCount ?? 5,
      tone: input.tone ?? "Exam-focused"
    });
    const data = await callClaude<AiProviderQuizDraftPayload>(buildRemedialQuizPrompt(normalized), this.apiKey, this.model);
    return this.wrap({ ...data, warnings: [...warningsArray(data.warnings), ...warnings] });
  }

  async regenerateQuestion(input: AiQuizGenerationInput & { questionIndex?: number }) {
    const { normalized, warnings } = sanitizeAiQuizGenerationInput({
      ...input,
      questionCount: Math.max(1, (input.questionIndex ?? 0) + 1)
    });
    const data = await callClaude<AiProviderQuizDraftPayload>(buildQuestionRegenerationPrompt({ ...normalized, questionIndex: input.questionIndex }), this.apiKey, this.model);
    return this.wrap({ ...data, warnings: [...warningsArray(data.warnings), ...warnings] });
  }

  async improveQuestion(input: { text?: string; tone?: string; userId?: string }) {
    if (!input.text?.trim()) {
      throw new Error("Question text is required for improvement.");
    }
    const data = await callClaude<AiProviderQuestionImprovementPayload>(
      buildQuestionImprovementPrompt({ text: input.text.trim(), tone: input.tone ?? "Conceptual" }),
      this.apiKey,
      this.model
    );
    return this.wrap(data);
  }

  async generateExplanation(input: { question?: string; answer?: string; userId?: string }) {
    if (!input.question?.trim()) {
      throw new Error("Question text is required to generate an explanation.");
    }
    const data = await callClaude<AiProviderExplanationPayload>(
      buildExplanationPrompt({ question: input.question.trim(), answer: input.answer?.trim() }),
      this.apiKey,
      this.model
    );
    return this.wrap(data);
  }

  private wrap<T>(data: T): AiProviderExecution<T> {
    return {
      data,
      provider: {
        provider: "claude",
        model: this.model
      }
    };
  }
}
