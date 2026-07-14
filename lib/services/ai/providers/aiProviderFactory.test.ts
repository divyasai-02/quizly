import { afterEach, describe, expect, it } from "vitest";
import { resolveAiProviders } from "@/lib/services/ai/providers/aiProviderFactory";

const previousEnv = {
  AI_PROVIDER: process.env.AI_PROVIDER,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL
};

afterEach(() => {
  if (previousEnv.AI_PROVIDER === undefined) {
    delete process.env.AI_PROVIDER;
  } else {
    process.env.AI_PROVIDER = previousEnv.AI_PROVIDER;
  }

  if (previousEnv.ANTHROPIC_API_KEY === undefined) {
    delete process.env.ANTHROPIC_API_KEY;
  } else {
    process.env.ANTHROPIC_API_KEY = previousEnv.ANTHROPIC_API_KEY;
  }

  if (previousEnv.ANTHROPIC_MODEL === undefined) {
    delete process.env.ANTHROPIC_MODEL;
  } else {
    process.env.ANTHROPIC_MODEL = previousEnv.ANTHROPIC_MODEL;
  }
});

describe("resolveAiProviders", () => {
  it("uses the mock provider by default", () => {
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;

    const result = resolveAiProviders();

    expect(result.requestedProvider).toBe("mock");
    expect(result.provider.name).toBe("mock");
    expect(result.fallback.name).toBe("mock");
    expect(result.factoryWarnings).toEqual([]);
  });

  it("falls back to mock when Claude is requested without an API key", () => {
    process.env.AI_PROVIDER = "claude";
    delete process.env.ANTHROPIC_API_KEY;

    const result = resolveAiProviders();

    expect(result.requestedProvider).toBe("claude");
    expect(result.provider.name).toBe("mock");
    expect(result.fallback.name).toBe("mock");
    expect(result.factoryWarnings[0]).toContain("ANTHROPIC_API_KEY");
  });
});
