import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateExplanation } = vi.hoisted(() => ({
  generateExplanation: vi.fn()
}));

vi.mock("@/lib/serverSession", () => ({
  requireProfessor: () => ({ id: "prof-1" })
}));

vi.mock("@/lib/services/aiService", () => ({
  aiService: {
    generateExplanation
  }
}));

import { POST } from "./route";

describe("POST /api/ai/generate-explanation", () => {
  beforeEach(() => {
    generateExplanation.mockReset();
  });

  it("returns generated explanation text", async () => {
    generateExplanation.mockResolvedValue({
      explanation: "Reasoned explanation.",
      warnings: [],
      provider: {
        provider: "mock",
        model: "quizly-mock-v2",
        usedFallback: false,
        warnings: []
      }
    });

    const response = await POST(new Request("http://localhost/api/ai/generate-explanation", {
      method: "POST",
      body: JSON.stringify({ question: "What is SQL?", answer: "Structured Query Language" }),
      headers: { "Content-Type": "application/json" }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      explanation: "Reasoned explanation.",
      warnings: [],
      provider: {
        provider: "mock",
        model: "quizly-mock-v2",
        usedFallback: false,
        warnings: []
      }
    });
  });
});
