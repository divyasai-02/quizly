import { beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import {
  MAX_EXTRACTED_TEXT_LENGTH,
  MAX_TEXT_UPLOAD_BYTES,
  normalizeExtractedText,
  parseDocxFile,
  parsePdfFile,
  parsePptxFile,
  parseUploadedMaterial,
  parseTextFile
} from "@/lib/services/materialParsingService";

vi.mock("pdf-parse", () => ({
  default: vi.fn(async () => ({
    text: "Database normalization reduces redundancy.",
    numpages: 1
  }))
}));

function createFile(contents: string, name: string, type: string) {
  return new File([contents], name, { type });
}

async function createDocxBuffer(text: string) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>
</w:document>`);
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

async function createPptxBuffer(text: string) {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld>
</p:sld>`);
  return Buffer.from(await zip.generateAsync({ type: "uint8array" }));
}

describe("materialParsingService", () => {
  beforeEach(() => {
    // no shared mutable state to reset yet
  });

  it("parses text files successfully", async () => {
    const result = await parseUploadedMaterial(createFile("Closures preserve lexical scope.\n\nThey help retain state.", "notes.txt", "text/plain"));

    expect(result.parser).toBe("txt");
    expect(result.extractedText).toContain("Closures preserve lexical scope.");
    expect(result.extractedCharCount).toBe(result.extractedText.length);
  });

  it("parses markdown files and strips common markdown syntax", async () => {
    const result = await parseUploadedMaterial(createFile("# SQL Joins\n\n- INNER JOIN\n- LEFT JOIN\n\nUse `JOIN`.", "joins.md", "text/markdown"));

    expect(result.parser).toBe("markdown");
    expect(result.extractedText).toContain("SQL Joins");
    expect(result.extractedText).not.toContain("#");
    expect(result.extractedText).not.toContain("`");
  });

  it("rejects unsupported file types clearly", async () => {
    await expect(parseUploadedMaterial(createFile("{}", "archive.zip", "application/zip")))
      .rejects.toThrow("Unsupported file type");
  });

  it("parses PDF files", async () => {
    const result = await parsePdfFile(Buffer.from("%PDF test"), "notes.pdf", "application/pdf");

    expect(result.parser).toBe("pdf");
    expect(result.extractedText).toContain("Database normalization");
  });

  it("parses DOCX files", async () => {
    const result = await parseDocxFile(await createDocxBuffer("Indexes speed up database lookups."), "notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    expect(result.parser).toBe("docx");
    expect(result.extractedText).toContain("Indexes speed up");
  });

  it("parses PPTX slide text", async () => {
    const result = await parsePptxFile(await createPptxBuffer("Round Robin uses a time quantum."), "slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");

    expect(result.parser).toBe("pptx");
    expect(result.extractedText).toContain("Round Robin");
  });

  it("rejects oversized files", async () => {
    const oversized = new File([new Uint8Array(MAX_TEXT_UPLOAD_BYTES + 1)], "large.txt", { type: "text/plain" });
    await expect(parseUploadedMaterial(oversized)).rejects.toThrow("5MB or smaller");
  });

  it("warns when extracted text is short", async () => {
    const result = await parseUploadedMaterial(createFile("Tiny note.", "short.txt", "text/plain"));
    expect(result.warnings.some((warning) => warning.includes("short"))).toBe(true);
    expect(result.confidence).toBe("low");
  });

  it("normalizes whitespace and repeated blank lines", async () => {
    const result = await parseTextFile(Buffer.from("Line one.\r\n\r\n\r\nLine   two.\t\t\r\n"), "notes.txt", "text/plain");
    expect(normalizeExtractedText("Line one.\r\n\r\n\r\nLine   two.\t\t\r\n")).toBe("Line one.\n\nLine two.");
    expect(result.extractedText).toBe("Line one.\n\nLine two.");
  });

  it("trims extracted text when it exceeds the safety limit", async () => {
    const longText = "A".repeat(MAX_EXTRACTED_TEXT_LENGTH + 50);
    const result = await parseUploadedMaterial(createFile(longText, "long.txt", "text/plain"));

    expect(result.extractedText.length).toBe(MAX_EXTRACTED_TEXT_LENGTH);
    expect(result.warnings.some((warning) => warning.includes("trimmed"))).toBe(true);
  });
});
