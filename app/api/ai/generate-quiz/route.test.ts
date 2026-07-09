import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateQuizDraft } = vi.hoisted(() => ({
  generateQuizDraft: vi.fn()
}));

vi.mock("@/lib/serverSession", () => ({
  requireProfessor: () => ({ id: "prof-1" })
}));

vi.mock("@/lib/services/aiQuizGenerationService", () => ({
  generateQuizDraft
}));

import { POST } from "./route";

describe("POST /api/ai/generate-quiz", () => {
  beforeEach(() => {
    generateQuizDraft.mockReset();
  });

  it("returns AI generation payload", async () => {
    generateQuizDraft.mockResolvedValue({
      generationId: "gen-1",
      summary: "Drafted questions",
      warnings: [],
      coverage: ["Closures"],
      estimatedDifficulty: "Mixed",
      suggestedTimeMinutes: 10,
      questions: []
    });

    const response = await POST(new Request("http://localhost/api/ai/generate-quiz", {
      method: "POST",
      body: JSON.stringify({ mode: "quiz-builder", topic: "JavaScript" }),
      headers: { "Content-Type": "application/json" }
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ generationId: "gen-1" });
    expect(generateQuizDraft).toHaveBeenCalledWith(expect.objectContaining({ userId: "prof-1", topic: "JavaScript" }));
  });
});
