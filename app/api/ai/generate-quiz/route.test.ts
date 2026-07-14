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
      questions: [],
      provider: {
        provider: "mock",
        model: "quizly-mock-v2",
        usedFallback: false,
        warnings: []
      }
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

  it("passes uploaded material through to the service when provided", async () => {
    generateQuizDraft.mockResolvedValue({
      generationId: "gen-2",
      summary: "Drafted questions",
      warnings: [],
      coverage: ["Normalization"],
      estimatedDifficulty: "Medium",
      suggestedTimeMinutes: 8,
      questions: [],
      provider: {
        provider: "mock",
        model: "quizly-mock-v2",
        usedFallback: false,
        warnings: []
      }
    });

    const response = await POST(new Request("http://localhost/api/ai/generate-quiz", {
      method: "POST",
      body: JSON.stringify({
        mode: "quiz-builder",
        materialText: "Normalization reduces redundancy.",
        materialMetadata: {
          materialId: "material-1",
          fileName: "notes.txt",
          fileType: "text/plain",
          fileSize: 128,
          extractedCharCount: 32,
          parser: "txt",
          confidence: "medium",
          previewText: "Normalization reduces redundancy."
        }
      }),
      headers: { "Content-Type": "application/json" }
    }));

    expect(response.status).toBe(200);
    expect(generateQuizDraft).toHaveBeenCalledWith(expect.objectContaining({
      userId: "prof-1",
      materialText: "Normalization reduces redundancy.",
      materialMetadata: expect.objectContaining({ fileName: "notes.txt" })
    }));
  });
});
