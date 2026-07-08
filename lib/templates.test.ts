import { describe, expect, it } from "vitest";
import { buildTemplateQuizData, getTemplateById, listTemplates } from "./templates";

describe("template authoring helpers", () => {
  it("lists seeded templates", () => {
    const templates = listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(6);
  });

  it("returns a template by id", () => {
    const template = getTemplateById("java-basics-10");
    expect(template?.title).toContain("Java Basics");
  });

  it("builds draft quiz creation data from a template", () => {
    const template = getTemplateById("dbms-fundamentals-template");
    if (!template) throw new Error("Template not found");
    const payload = buildTemplateQuizData(template, "prof-john");
    expect(payload.professorId).toBe("prof-john");
    expect(payload.questions.create.length).toBeGreaterThan(0);
    expect(payload.questions.create[0].sourceLabel).toBe("Template");
  });
});
