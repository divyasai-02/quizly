import { ClaudeAiProvider } from "@/lib/services/ai/providers/claudeAiProvider";
import { MockAiProvider } from "@/lib/services/ai/providers/mockAiProvider";
import { OpenRouterAiProvider } from "@/lib/services/ai/providers/openRouterAiProvider";
import type { AiProvider } from "@/lib/services/ai/providers/aiProvider";
import type { AiProviderName } from "@/lib/services/ai/types";

type ProviderResolution = {
  requestedProvider: AiProviderName;
  provider: AiProvider;
  fallback: AiProvider;
  factoryWarnings: string[];
};

export function resolveAiProviders(): ProviderResolution {
  const configuredProvider = process.env.AI_PROVIDER?.trim().toLowerCase();
  const requestedProvider: AiProviderName = configuredProvider === "claude" || configuredProvider === "openrouter" ? configuredProvider : "mock";
  const mockProvider = new MockAiProvider();

  if (requestedProvider === "mock") {
    return {
      requestedProvider,
      provider: mockProvider,
      fallback: mockProvider,
      factoryWarnings: []
    };
  }

  if (requestedProvider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    const model = process.env.OPENROUTER_MODEL?.trim() || "openai/gpt-4o-mini";
    if (!apiKey) {
      return { requestedProvider, provider: mockProvider, fallback: mockProvider, factoryWarnings: ["OpenRouter was requested but OPENROUTER_API_KEY is missing. Using mock fallback."] };
    }
    return { requestedProvider, provider: new OpenRouterAiProvider({ apiKey, model }), fallback: mockProvider, factoryWarnings: [] };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-latest";
  if (!apiKey) {
    return {
      requestedProvider,
      provider: mockProvider,
      fallback: mockProvider,
      factoryWarnings: ["Claude was requested but ANTHROPIC_API_KEY is missing. Using mock fallback."]
    };
  }

  return {
    requestedProvider,
    provider: new ClaudeAiProvider({ apiKey, model }),
    fallback: mockProvider,
    factoryWarnings: []
  };
}
