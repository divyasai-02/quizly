import type { QuestionBankInput } from "@/lib/questionBank";

type CsvRow = Record<string, string>;

const TRUE_VALUES = new Set(["true", "yes", "y", "1", "correct"]);

function get(row: CsvRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key.toLowerCase()];
    if (value?.trim()) return value.trim();
  }
  return "";
}

function splitList(value: string) {
  if (!value.trim()) return [];
  return value
    .split(/\||;|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeJsonPayload(payload: unknown) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const object = payload as Record<string, unknown>;
    if (Array.isArray(object.questions)) return object.questions;
    if (Array.isArray(object.items)) return object.items;
  }
  throw new Error("JSON import must be an array, or an object with questions/items.");
}

function normalizeOptions(value: unknown, correctValue: unknown) {
  if (Array.isArray(value)) {
    return value.map((option, index) => {
      if (typeof option === "string") {
        return { text: option, isCorrect: isCorrectOption(option, index, correctValue) };
      }
      const item = option as { text?: string; isCorrect?: boolean; correct?: boolean };
      return { text: String(item.text ?? "").trim(), isCorrect: !!(item.isCorrect ?? item.correct) || isCorrectOption(String(item.text ?? ""), index, correctValue) };
    });
  }

  const optionTexts = splitList(String(value ?? ""));
  return optionTexts.map((option, index) => ({ text: option, isCorrect: isCorrectOption(option, index, correctValue) }));
}

function isCorrectOption(optionText: string, optionIndex: number, correctValue: unknown): boolean {
  if (Array.isArray(correctValue)) {
    return correctValue.some((value) => isCorrectOption(optionText, optionIndex, value));
  }
  const normalized = String(correctValue ?? "").trim().toLowerCase();
  if (!normalized) return false;
  const accepted = normalized.split(/,|\||;/).map((item) => item.trim()).filter(Boolean);
  const numericIndexes = accepted.filter((value) => /^\d+$/.test(value)).map(Number);
  const usesZeroBasedIndexes = numericIndexes.includes(0);
  if (numericIndexes.length) {
    return numericIndexes.some((value) => optionIndex === (usesZeroBasedIndexes ? value : value - 1));
  }
  return accepted.some((value) => value === optionText.trim().toLowerCase() || (TRUE_VALUES.has(value) && optionText.trim().toLowerCase() === "true"));
}

function normalizeImportedObject(item: Record<string, unknown>): QuestionBankInput {
  const type = String(item.type ?? item.questionType ?? "MCQ_SINGLE");
  const correct = item.correct ?? item.answer ?? item.correctAnswer ?? item.correctOptionIndexes;
  let options = normalizeOptions(item.options ?? item.choices, correct);

  if (!options.length && (type.includes("TRUE_FALSE") || type.toLowerCase().includes("true"))) {
    options = ["True", "False"].map((option, index) => ({ text: option, isCorrect: isCorrectOption(option, index, correct) }));
  }

  return {
    subject: String(item.subject ?? "").trim(),
    topic: String(item.topic ?? item.chapter ?? "").trim(),
    difficulty: String(item.difficulty ?? "Easy").trim(),
    type,
    text: String(item.text ?? item.question ?? "").trim(),
    explanation: String(item.explanation ?? item.rationale ?? "").trim(),
    marks: Number(item.marks ?? item.points ?? 1),
    options,
    aiGenerated: !!item.aiGenerated
  };
}

function normalizeImportedCsvRow(row: CsvRow): QuestionBankInput {
  return normalizeImportedObject({
    subject: get(row, "subject"),
    topic: get(row, "topic", "chapter"),
    difficulty: get(row, "difficulty") || "Easy",
    type: get(row, "type", "questionType") || "MCQ_SINGLE",
    text: get(row, "text", "question"),
    explanation: get(row, "explanation", "rationale"),
    marks: get(row, "marks", "points") || 1,
    options: get(row, "options", "choices"),
    correct: get(row, "correct", "answer", "correctAnswer"),
    aiGenerated: TRUE_VALUES.has(get(row, "aiGenerated", "ai").toLowerCase())
  });
}

export function parseQuestionBankImport(text: string, filename = "import.json") {
  if (!text.trim()) throw new Error("Import file is empty.");

  if (filename.toLowerCase().endsWith(".csv")) {
    const table = parseCsv(text);
    if (table.length < 2) throw new Error("CSV import must include a header row and at least one question row.");
    const headers = table[0].map((header) => header.trim().toLowerCase());
    return table.slice(1).map((values) => {
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      return normalizeImportedCsvRow(row);
    });
  }

  const payload = JSON.parse(text) as unknown;
  return normalizeJsonPayload(payload).map((item) => normalizeImportedObject(item as Record<string, unknown>));
}
