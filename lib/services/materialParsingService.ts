import type { AiMaterialConfidence, AiMaterialParser, ParsedMaterialResult } from "@/lib/services/ai/types";

export const MAX_TEXT_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_EXTRACTED_TEXT_LENGTH = 20000;
export const MATERIAL_PREVIEW_LENGTH = 1200;
const SHORT_TEXT_WARNING_THRESHOLD = 80;

const TEXT_EXTENSIONS = new Set(["txt"]);
const MARKDOWN_EXTENSIONS = new Set(["md", "markdown"]);
const DOCX_EXTENSIONS = new Set(["docx"]);
const PPTX_EXTENSIONS = new Set(["pptx"]);
const TEXT_MIME_TYPES = new Set(["text/plain"]);
const MARKDOWN_MIME_TYPES = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);
const DOCX_MIME_TYPES = new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const PPTX_MIME_TYPES = new Set(["application/vnd.openxmlformats-officedocument.presentationml.presentation"]);

function materialId() {
  return `material-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function getParser(fileName: string, fileType?: string): AiMaterialParser {
  const extension = getExtension(fileName);
  const normalizedType = fileType?.toLowerCase() ?? "";

  if (TEXT_EXTENSIONS.has(extension) || TEXT_MIME_TYPES.has(normalizedType)) return "txt";
  if (MARKDOWN_EXTENSIONS.has(extension) || MARKDOWN_MIME_TYPES.has(normalizedType)) return "markdown";
  if (extension === "pdf" || normalizedType === "application/pdf") return "pdf";
  if (DOCX_EXTENSIONS.has(extension) || DOCX_MIME_TYPES.has(normalizedType)) return "docx";
  if (PPTX_EXTENSIONS.has(extension) || PPTX_MIME_TYPES.has(normalizedType)) return "pptx";
  return "unsupported";
}

function stripMarkdownSyntax(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1");
}

export function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function validateExtractedText(text: string) {
  const warnings: string[] = [];

  if (!text.trim()) {
    throw new Error("We could not extract readable text from that file.");
  }

  if (text.length < SHORT_TEXT_WARNING_THRESHOLD) {
    warnings.push("The extracted material is short, so generated questions may be generic. Review carefully.");
  }

  const confidence: AiMaterialConfidence =
    text.length >= 1000 ? "high"
    : text.length >= 250 ? "medium"
    : "low";

  return { warnings, confidence };
}

function buildParsedMaterial(input: {
  buffer: Buffer;
  name: string;
  parser: Exclude<AiMaterialParser, "unsupported">;
  rawText: string;
  type: string;
  warnings?: string[];
}) {
  const normalizedText = input.parser === "markdown"
    ? normalizeExtractedText(stripMarkdownSyntax(input.rawText))
    : normalizeExtractedText(input.rawText);
  const warnings: string[] = [];
  warnings.push(...(input.warnings ?? []));
  let extractedText = normalizedText;
  if (extractedText.length > MAX_EXTRACTED_TEXT_LENGTH) {
    extractedText = extractedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
    warnings.push(`Extracted text was trimmed to ${MAX_EXTRACTED_TEXT_LENGTH} characters for safer AI generation.`);
  }

  const validation = validateExtractedText(extractedText);
  warnings.push(...validation.warnings);

  return {
    materialId: materialId(),
    fileName: input.name,
    fileType: input.type || "application/octet-stream",
    fileSize: input.buffer.byteLength,
    extractedText,
    extractedCharCount: extractedText.length,
    previewText: extractedText.slice(0, MATERIAL_PREVIEW_LENGTH),
    warnings,
    parser: input.parser,
    confidence: validation.confidence
  } satisfies ParsedMaterialResult;
}

export async function parseTextFile(buffer: Buffer, name: string, type: string) {
  const parser = getParser(name, type);
  return buildParsedMaterial({
    buffer,
    name,
    type: type || "text/plain",
    parser: parser === "markdown" ? "markdown" : "txt",
    rawText: buffer.toString("utf8")
  });
}

export async function parsePdfFile(buffer: Buffer, name: string, type: string) {
  const pdfModule = await import("pdf-parse");
  const pdfParse = pdfModule.default as (data: Buffer) => Promise<{ text?: string; numpages?: number }>;
  const result = await pdfParse(buffer);
  return buildParsedMaterial({
    buffer,
    name,
    type: type || "application/pdf",
    parser: "pdf",
    rawText: result.text ?? "",
    warnings: result.numpages ? [`Parsed ${result.numpages} PDF page${result.numpages === 1 ? "" : "s"}.`] : []
  });
}

export async function parseDocxFile(buffer: Buffer, name: string, type: string) {
  const mammothModule = await import("mammoth");
  const mammoth = mammothModule.default ?? mammothModule;
  const result = await mammoth.extractRawText({ buffer });
  return buildParsedMaterial({
    buffer,
    name,
    type: type || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    parser: "docx",
    rawText: result.value ?? "",
    warnings: result.messages?.length ? result.messages.map((message) => message.message).filter(Boolean) : []
  });
}

function decodeXmlEntities(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

export async function parsePptxFile(buffer: Buffer, name: string, type: string) {
  const jsZipModule = await import("jszip");
  const JSZip = jsZipModule.default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.values(zip.files)
    .filter((file) => /^ppt\/slides\/slide\d+\.xml$/i.test(file.name))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

  const slideTexts = await Promise.all(slideFiles.map(async (file) => {
    const xml = await file.async("text");
    const matches = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)];
    return matches.map((match) => decodeXmlEntities(match[1].replace(/<[^>]+>/g, " "))).join(" ");
  }));

  return buildParsedMaterial({
    buffer,
    name,
    type: type || "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    parser: "pptx",
    rawText: slideTexts.join("\n\n"),
    warnings: slideFiles.length ? [`Parsed ${slideFiles.length} PowerPoint slide${slideFiles.length === 1 ? "" : "s"}.`] : []
  });
}

export async function parseUploadedMaterial(file: File) {
  if (!(file instanceof File)) {
    throw new Error("Choose a file before uploading material.");
  }

  if (file.size <= 0) {
    throw new Error("The selected file is empty.");
  }

  if (file.size > MAX_TEXT_UPLOAD_BYTES) {
    throw new Error("Files must be 5MB or smaller for this MVP.");
  }

  const parser = getParser(file.name, file.type);
  if (parser === "unsupported") {
    throw new Error("Unsupported file type. Upload TXT, Markdown, PDF, DOCX, or PPTX material.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (parser === "pdf") return parsePdfFile(buffer, file.name, file.type);
  if (parser === "docx") return parseDocxFile(buffer, file.name, file.type);
  if (parser === "pptx") return parsePptxFile(buffer, file.name, file.type);
  return parseTextFile(buffer, file.name, file.type);
}
