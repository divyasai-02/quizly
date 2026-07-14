import type {
  AiDifficulty,
  AiDraftQuestion,
  AiProviderExplanationPayload,
  AiProviderQuestionImprovementPayload,
  AiProviderQuizDraftPayload,
  AiQuestionType,
  AiQuizGenerationInput,
  NormalizedAiQuizGenerationInput
} from "@/lib/services/ai/types";

const DEFAULT_TYPES: AiQuestionType[] = ["MCQ Single", "True/False", "Short Answer"];
const MAX_QUESTION_COUNT = 30;
const MAX_NOTES_LENGTH = 16000;
const MAX_MATERIAL_LENGTH = 20000;

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function arrayValues(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: unknown) {
  return Array.from(new Set(arrayValues(values).filter((value): value is string => typeof value === "string" && value.trim().length > 0).map((value) => value.trim())));
}

function normalizeDifficulty(value: unknown, fallback: AiDifficulty): AiDifficulty {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  if (normalized === "mixed") return "Mixed";
  return fallback;
}

function normalizeConcreteDifficulty(value: unknown, fallback: "Easy" | "Medium" | "Hard"): "Easy" | "Medium" | "Hard" {
  const normalized = normalizeDifficulty(value, fallback);
  return normalized === "Mixed" ? fallback : normalized;
}

function normalizeQuestionType(value: unknown): AiQuestionType {
  if (typeof value !== "string") return "Short Answer";
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("multiple")) return "MCQ Multiple";
  if (normalized.includes("true") || normalized.includes("false")) return "True/False";
  if (normalized.includes("blank")) return "Fill in the Blank";
  if (normalized.includes("short")) return "Short Answer";
  return "MCQ Single";
}

function normalizeConfidence(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0.7;
  if (value <= 1) return Math.max(0, Math.min(1, value));
  return Math.max(0, Math.min(1, value / 100));
}

function normalizePositiveNumber(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeAiQuizGenerationInput(input: AiQuizGenerationInput) {
  const topic = input.topic?.trim();
  const pastedNotesRaw = input.pastedNotes?.trim();
  const materialTextRaw = input.materialText?.trim();
  if (!topic && !pastedNotesRaw && !materialTextRaw) {
    throw new Error("Enter a topic, paste notes, or upload material before generating AI drafts.");
  }

  const questionCount = input.questionCount ?? 8;
  if (questionCount < 1 || questionCount > MAX_QUESTION_COUNT) {
    throw new Error(`Question count must be between 1 and ${MAX_QUESTION_COUNT}.`);
  }

  const marksPerQuestion = input.marksPerQuestion ?? 1;
  if (marksPerQuestion <= 0) {
    throw new Error("Marks per question must be positive.");
  }

  const questionTypes = input.questionTypes?.length ? input.questionTypes : DEFAULT_TYPES;
  if (!questionTypes.length) {
    throw new Error("Select at least one question type.");
  }

  const warnings: string[] = [];
  let pastedNotes = pastedNotesRaw;
  let materialText = materialTextRaw;
  if (pastedNotes && pastedNotes.length > MAX_NOTES_LENGTH) {
    pastedNotes = pastedNotes.slice(0, MAX_NOTES_LENGTH);
    warnings.push(`Pasted notes were trimmed to ${MAX_NOTES_LENGTH} characters for safer AI generation.`);
  }
  if (materialText && materialText.length > MAX_MATERIAL_LENGTH) {
    materialText = materialText.slice(0, MAX_MATERIAL_LENGTH);
    warnings.push(`Uploaded material was trimmed to ${MAX_MATERIAL_LENGTH} characters for safer AI generation.`);
  }
  if (pastedNotes && materialText) {
    warnings.push("Uploaded material will be prioritized over pasted notes for AI drafting.");
  }

  const normalized: NormalizedAiQuizGenerationInput = {
    mode: input.mode,
    topic,
    pastedNotes,
    materialText,
    materialMetadata: input.materialMetadata,
    subject: input.subject?.trim(),
    classId: input.classId,
    questionCount,
    questionTypes,
    difficulty: input.difficulty ?? "Mixed",
    bloomLevel: input.bloomLevel ?? "Understanding",
    marksPerQuestion,
    negativeMarking: input.negativeMarking ?? false,
    tone: input.tone ?? "Conceptual",
    avoidQuestionBankDuplicates: input.avoidQuestionBankDuplicates ?? true,
    userId: input.userId
  };

  return { normalized, warnings };
}

export function truncateForAudit(value?: string, max = 500) {
  if (!value) return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}... [truncated for retention review]`;
}

export function validateQuizDraftPayload(
  payload: AiProviderQuizDraftPayload,
  input: NormalizedAiQuizGenerationInput
) {
  const warnings = uniqueStrings([...arrayValues(payload.warnings), ...(input.avoidQuestionBankDuplicates ? [] : [])]);
  const discarded: string[] = [];
  const questions: AiDraftQuestion[] = [];

  for (const [index, rawQuestion] of arrayValues(payload.questions).entries()) {
    const question = (rawQuestion ?? {}) as Record<string, unknown>;
    const type = normalizeQuestionType(question.type);
    const text = asString(question.text);
    if (!text) {
      discarded.push(`Discarded AI question ${index + 1} because question text was missing.`);
      continue;
    }

    const rawOptions = Array.isArray(question.options) ? question.options : [];
    const optionTexts = rawOptions
      .map((option) => {
        if (typeof option === "string") return option.trim();
        if (option && typeof option === "object" && typeof (option as { text?: unknown }).text === "string") return String((option as { text: string }).text).trim();
        return "";
      })
      .filter(Boolean);

    const correctOptionIds = uniqueStrings(Array.isArray(question.correctOptionIds) ? question.correctOptionIds : []);
    const correctIndexes = Array.isArray(question.correctOptionIndexes)
      ? question.correctOptionIndexes.filter((value): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0)
      : [];
    const correctAnswer = asString(question.correctAnswer);
    const explanation = asString(question.explanation) || "Professor review required. Explanation draft was incomplete.";
    const difficulty = normalizeConcreteDifficulty(
      question.difficulty,
      input.difficulty === "Mixed" ? "Medium" : input.difficulty
    );
    const topicTag = asString(question.topicTag) || input.topic || input.subject || "General";
    const marks = normalizePositiveNumber(question.marks, input.marksPerQuestion);
    const confidence = normalizeConfidence(question.confidence);
    const source = input.materialText
      ? "Based on uploaded material"
      : input.pastedNotes
      ? "Based on pasted notes"
      : input.topic
        ? "Based on topic prompt"
        : "General knowledge - review carefully";

    if ((type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False") && optionTexts.length < 2) {
      discarded.push(`Discarded AI question ${index + 1} because MCQ-style questions need at least 2 options.`);
      continue;
    }

    const options = (type === "Short Answer" || type === "Fill in the Blank"
      ? [{ id: `${randomId(`opt-${index + 1}`)}`, text: correctAnswer || "Professor review required" }]
      : optionTexts.map((optionText, optionIndex) => ({ id: `${randomId(`opt-${index + 1}-${optionIndex + 1}`)}`, text: optionText })));

    let normalizedCorrectOptionIds = correctOptionIds.filter((id) => options.some((option) => option.id === id));
    if (!normalizedCorrectOptionIds.length && correctIndexes.length) {
      normalizedCorrectOptionIds = correctIndexes.map((correctIndex) => options[correctIndex]?.id).filter((value): value is string => Boolean(value));
    }
    if (!normalizedCorrectOptionIds.length && (type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False")) {
      if (type === "True/False") {
        normalizedCorrectOptionIds = [options[0]?.id].filter((value): value is string => Boolean(value));
      } else {
        normalizedCorrectOptionIds = [options[0]?.id].filter((value): value is string => Boolean(value));
      }
    }

    if ((type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False") && !normalizedCorrectOptionIds.length) {
      discarded.push(`Discarded AI question ${index + 1} because no correct answer could be normalized.`);
      continue;
    }

    if ((type === "Short Answer" || type === "Fill in the Blank") && !correctAnswer) {
      warnings.push(`Question ${index + 1} did not include a complete accepted answer. Added a professor-review answer for editing.`);
    }

    questions.push({
      tempId: `draft-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      text,
      options,
      correctOptionIds: type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False" ? normalizedCorrectOptionIds : undefined,
      correctAnswer: type === "Short Answer" || type === "Fill in the Blank" ? (correctAnswer || options[0]?.text || "Professor review required") : undefined,
      explanation,
      difficulty,
      topicTag,
      marks,
      confidence: Number(confidence.toFixed(2)),
      source,
      aiGenerated: true
    });
  }

  warnings.push(...discarded);

  if (!questions.length) {
    throw new Error("AI output could not be validated into usable questions. Please try again or adjust the prompt.");
  }

  return {
    summary: asString(payload.summary) || `Drafted ${questions.length} AI questions with professor review required.`,
    warnings,
    coverage: uniqueStrings(payload.coverage),
    estimatedDifficulty: normalizeDifficulty(payload.estimatedDifficulty, input.difficulty),
    suggestedTimeMinutes: Math.max(5, Math.round(normalizePositiveNumber(payload.suggestedTimeMinutes, questions.length * (input.mode === "analytics-remedial" ? 1 : 2)))),
    questions
  };
}

export function validateExplanationPayload(payload: AiProviderExplanationPayload) {
  const explanation = asString(payload.explanation);
  if (!explanation) {
    throw new Error("AI provider did not return a usable explanation.");
  }
  return {
    explanation,
    warnings: uniqueStrings(payload.warnings)
  };
}

export function validateQuestionImprovementPayload(payload: AiProviderQuestionImprovementPayload, fallbackText: string) {
  const text = asString(payload.text) || fallbackText;
  const rationale = asString(payload.rationale) || "Clarified wording while preserving the original learning objective.";
  return {
    text,
    rationale,
    warnings: uniqueStrings(payload.warnings)
  };
}
