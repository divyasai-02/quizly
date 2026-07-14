import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseUploadedMaterial } = vi.hoisted(() => ({
  parseUploadedMaterial: vi.fn()
}));

vi.mock("@/lib/serverSession", () => ({
  requireProfessor: () => ({ id: "prof-1" })
}));

vi.mock("@/lib/services/materialParsingService", () => ({
  parseUploadedMaterial
}));

import { POST } from "./route";

describe("POST /api/ai/parse-material", () => {
  beforeEach(() => {
    parseUploadedMaterial.mockReset();
  });

  it("returns parsed material details", async () => {
    parseUploadedMaterial.mockResolvedValue({
      materialId: "material-1",
      fileName: "notes.txt",
      fileType: "text/plain",
      fileSize: 128,
      extractedText: "Database normalization reduces redundancy.",
      extractedCharCount: 41,
      previewText: "Database normalization reduces redundancy.",
      warnings: [],
      parser: "txt",
      confidence: "medium"
    });

    const formData = new FormData();
    formData.append("file", new File(["Database normalization reduces redundancy."], "notes.txt", { type: "text/plain" }));

    const response = await POST(new Request("http://localhost/api/ai/parse-material", {
      method: "POST",
      body: formData
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ materialId: "material-1", parser: "txt" });
    expect(parseUploadedMaterial).toHaveBeenCalled();
  });

  it("returns a friendly error for unsupported file types", async () => {
    parseUploadedMaterial.mockRejectedValue(new Error("Unsupported file type. Upload TXT or Markdown now."));

    const formData = new FormData();
    formData.append("file", new File(["{}"], "slides.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }));

    const response = await POST(new Request("http://localhost/api/ai/parse-material", {
      method: "POST",
      body: formData
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unsupported file type. Upload TXT or Markdown now." });
  });
});
