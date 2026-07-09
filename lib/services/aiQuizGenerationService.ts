import { AIInsightType } from "@prisma/client";
import type { QuizQuestion } from "@/data/mockData";
import { prisma } from "@/lib/prisma";

export type AiAgentMode = "quiz-builder" | "question-bank" | "analytics-remedial";
export type AiQuestionType = "MCQ Single" | "MCQ Multiple" | "True/False" | "Short Answer" | "Fill in the Blank";
export type AiDifficulty = "Easy" | "Medium" | "Hard" | "Mixed";
export type AiBloomLevel = "Recall" | "Understanding" | "Application" | "Analysis";
export type AiTone = "Simple" | "Exam-focused" | "Conceptual" | "Placement prep";

export type AiQuizGenerationInput = {
  mode: AiAgentMode;
  topic?: string;
  pastedNotes?: string;
  subject?: string;
  classId?: string;
  questionCount?: number;
  questionTypes?: AiQuestionType[];
  difficulty?: AiDifficulty;
  bloomLevel?: AiBloomLevel;
  marksPerQuestion?: number;
  negativeMarking?: boolean;
  tone?: AiTone;
  avoidQuestionBankDuplicates?: boolean;
  userId?: string;
};

export type AiDraftQuestion = {
  tempId: string;
  type: AiQuestionType;
  text: string;
  options: Array<{ id: string; text: string }>;
  correctOptionIds?: string[];
  correctAnswer?: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topicTag: string;
  marks: number;
  confidence: number;
  source: "Based on topic prompt" | "Based on pasted notes" | "General knowledge - review carefully";
  aiGenerated: true;
};

export type AiQuizGenerationOutput = {
  generationId: string;
  summary: string;
  warnings: string[];
  coverage: string[];
  estimatedDifficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  suggestedTimeMinutes: number;
  questions: AiDraftQuestion[];
};

type NormalizedInput = Required<Pick<AiQuizGenerationInput, "mode" | "questionCount" | "questionTypes" | "difficulty" | "bloomLevel" | "marksPerQuestion" | "negativeMarking" | "tone" | "avoidQuestionBankDuplicates">> &
  Pick<AiQuizGenerationInput, "topic" | "pastedNotes" | "subject" | "classId" | "userId">;

type TopicBlueprint = {
  coverage: string[];
  stems: Array<{
    topicTag: string;
    type: AiQuestionType;
    text: string;
    options?: string[];
    correctIndexes?: number[];
    correctAnswer?: string;
    explanation: string;
    difficulty?: "Easy" | "Medium" | "Hard";
  }>;
};

const DEFAULT_TYPES: AiQuestionType[] = ["MCQ Single", "True/False", "Short Answer"];

function createGenerationId() {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function truncateForAudit(value?: string, max = 500) {
  if (!value) return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}... [truncated for retention review]`;
}

function sanitizeInput(input: AiQuizGenerationInput): NormalizedInput {
  const topic = input.topic?.trim();
  const pastedNotes = input.pastedNotes?.trim();
  if (!topic && !pastedNotes) {
    throw new Error("Enter a topic or paste notes before generating AI drafts.");
  }

  const questionCount = input.questionCount ?? 8;
  if (questionCount < 1 || questionCount > 30) {
    throw new Error("Question count must be between 1 and 30.");
  }

  const marksPerQuestion = input.marksPerQuestion ?? 1;
  if (marksPerQuestion <= 0) {
    throw new Error("Marks per question must be positive.");
  }

  const questionTypes = input.questionTypes?.length ? input.questionTypes : DEFAULT_TYPES;
  if (!questionTypes.length) {
    throw new Error("Select at least one question type.");
  }

  return {
    mode: input.mode,
    topic,
    pastedNotes,
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
}

function deriveKeywords(input: Pick<NormalizedInput, "topic" | "pastedNotes">) {
  const source = `${input.topic ?? ""} ${input.pastedNotes ?? ""}`.toLowerCase();
  return Array.from(
    new Set(
      source
        .split(/[^a-z0-9+#.]+/i)
        .map((value) => value.trim())
        .filter((value) => value.length >= 4)
    )
  ).slice(0, 8);
}

function detectBlueprint(input: NormalizedInput): TopicBlueprint {
  const source = `${input.topic ?? ""} ${input.pastedNotes ?? ""}`.toLowerCase();

  if (source.includes("javascript") || source.includes("java script") || source.includes("java ")) {
    return {
      coverage: ["Scope", "Hoisting", "Closures", "Execution context"],
      stems: [
        {
          topicTag: "Closures",
          type: "MCQ Single",
          text: "Which statement best describes a closure in JavaScript?",
          options: [
            "A function bundled with its lexical environment",
            "A method that closes a browser tab",
            "A loop that stops automatically",
            "A variable declared with var"
          ],
          correctIndexes: [0],
          explanation: "Closures keep access to variables from their outer scope even after the outer function finishes."
        },
        {
          topicTag: "Hoisting",
          type: "True/False",
          text: "Function declarations are hoisted in JavaScript before code execution begins.",
          options: ["True", "False"],
          correctIndexes: [0],
          explanation: "Function declarations are hoisted with their definitions, unlike function expressions."
        },
        {
          topicTag: "Scope",
          type: "MCQ Multiple",
          text: "Which declarations are block-scoped in modern JavaScript?",
          options: ["let", "const", "var", "function declarations inside a block"],
          correctIndexes: [0, 1],
          explanation: "let and const are block-scoped. var is function-scoped."
        },
        {
          topicTag: "Closures",
          type: "Short Answer",
          text: "Write one practical use case for closures in JavaScript.",
          correctAnswer: "Closures are useful for data privacy, callbacks, and maintaining state between function calls.",
          explanation: "A strong answer mentions preserving state or encapsulating private variables."
        }
      ]
    };
  }

  if (source.includes("dbms") || source.includes("sql") || source.includes("database")) {
    return {
      coverage: ["Normalization", "Joins", "Keys", "Queries"],
      stems: [
        {
          topicTag: "Normalization",
          type: "MCQ Single",
          text: "Which normal form removes partial dependency from a table?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          correctIndexes: [1],
          explanation: "Second Normal Form removes partial dependency from composite keys."
        },
        {
          topicTag: "SQL Joins",
          type: "MCQ Single",
          text: "Which SQL clause is used to combine rows from two tables based on a related column?",
          options: ["JOIN", "GROUP BY", "ORDER BY", "HAVING"],
          correctIndexes: [0],
          explanation: "JOIN combines rows using matching values between tables."
        },
        {
          topicTag: "Keys",
          type: "True/False",
          text: "A primary key can contain duplicate values.",
          options: ["True", "False"],
          correctIndexes: [1],
          explanation: "Primary keys must be unique and cannot be null."
        },
        {
          topicTag: "Query Writing",
          type: "Fill in the Blank",
          text: "Fill in the blank: The SQL clause used to sort rows is ________.",
          correctAnswer: "ORDER BY",
          explanation: "ORDER BY sorts query results in ascending or descending order."
        }
      ]
    };
  }

  if (source.includes("operating system") || source.includes(" os ") || source.endsWith("os") || source.includes("process scheduling")) {
    return {
      coverage: ["Scheduling", "Memory management", "Deadlocks", "Processes"],
      stems: [
        {
          topicTag: "Scheduling",
          type: "MCQ Single",
          text: "Which scheduling algorithm gives each process a fixed time slice?",
          options: ["FCFS", "Round Robin", "SJF", "Priority scheduling"],
          correctIndexes: [1],
          explanation: "Round Robin assigns CPU time in fixed quanta."
        },
        {
          topicTag: "Deadlocks",
          type: "True/False",
          text: "Mutual exclusion is one of the Coffman conditions for deadlock.",
          options: ["True", "False"],
          correctIndexes: [0],
          explanation: "All four Coffman conditions must be present for deadlock to occur."
        },
        {
          topicTag: "Memory management",
          type: "Short Answer",
          text: "What problem does paging help reduce in memory management?",
          correctAnswer: "Paging helps reduce external fragmentation.",
          explanation: "Paging divides memory into fixed-size pages and frames, which reduces external fragmentation."
        }
      ]
    };
  }

  if (source.includes("computer network") || source.includes("network") || source.includes("cn ")) {
    return {
      coverage: ["OSI model", "Protocols", "Routing", "Error control"],
      stems: [
        {
          topicTag: "OSI model",
          type: "MCQ Single",
          text: "Which OSI layer is responsible for logical addressing and routing?",
          options: ["Transport", "Network", "Data Link", "Session"],
          correctIndexes: [1],
          explanation: "The network layer handles logical addressing and path selection."
        },
        {
          topicTag: "Protocols",
          type: "MCQ Multiple",
          text: "Which of the following are transport-layer protocols?",
          options: ["TCP", "UDP", "IP", "HTTP"],
          correctIndexes: [0, 1],
          explanation: "TCP and UDP are transport-layer protocols. IP is network-layer and HTTP is application-layer."
        },
        {
          topicTag: "Error control",
          type: "True/False",
          text: "Checksums are used to detect transmission errors.",
          options: ["True", "False"],
          correctIndexes: [0],
          explanation: "Checksums help detect corruption in transmitted data."
        }
      ]
    };
  }

  if (source.includes("aptitude") || source.includes("quant") || source.includes("reasoning")) {
    return {
      coverage: ["Percentages", "Ratios", "Series", "Logic"],
      stems: [
        {
          topicTag: "Percentages",
          type: "MCQ Single",
          text: "A number increases from 80 to 100. What is the percentage increase?",
          options: ["20%", "25%", "15%", "30%"],
          correctIndexes: [1],
          explanation: "The increase is 20 on a base of 80, so the percentage increase is 25%."
        },
        {
          topicTag: "Series",
          type: "Fill in the Blank",
          text: "Fill in the blank: 2, 4, 8, 16, ________",
          correctAnswer: "32",
          explanation: "Each term doubles the previous term."
        },
        {
          topicTag: "Logic",
          type: "True/False",
          text: "All squares are rectangles.",
          options: ["True", "False"],
          correctIndexes: [0],
          explanation: "A square satisfies all properties of a rectangle."
        }
      ]
    };
  }

  return {
    coverage: ["Core ideas", "Definitions", "Applications", "Review points"],
    stems: [
      {
        topicTag: "Core concept",
        type: "MCQ Single",
        text: `Which statement best matches the core idea of ${input.topic ?? "the provided topic"}?`,
        options: ["Concept definition", "Unrelated example", "Historical trivia", "Random formula"],
        correctIndexes: [0],
        explanation: "The best answer should directly reflect the main idea of the topic."
      },
      {
        topicTag: "Application",
        type: "Short Answer",
        text: `Give one practical application of ${input.topic ?? "the topic"} in class or industry.`,
        correctAnswer: "A correct response should connect the topic to a realistic use case.",
        explanation: "Look for a concrete real-world application rather than a vague definition."
      }
    ]
  };
}

function applyNotesSignals(stem: TopicBlueprint["stems"][number], keywords: string[]) {
  if (!keywords.length) return stem;
  if (stem.type === "Short Answer" || stem.type === "Fill in the Blank") {
    return {
      ...stem,
      text: `${stem.text} Reference these notes terms if useful: ${keywords.slice(0, 3).join(", ")}.`,
      explanation: `${stem.explanation} Encourage learners to reuse note vocabulary such as ${keywords.slice(0, 2).join(" and ")}.`
    };
  }

  return {
    ...stem,
    explanation: `${stem.explanation} This wording was nudged toward note keywords like ${keywords.slice(0, 2).join(" and ")}.`
  };
}

function pickDifficulty(index: number, requested: AiDifficulty) {
  if (requested !== "Mixed") return requested;
  const rotation: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
  return rotation[index % rotation.length];
}

function pickQuestionType(index: number, requested: AiQuestionType[], fallback: AiQuestionType) {
  return requested[index % requested.length] ?? fallback;
}

function buildQuestion(stem: TopicBlueprint["stems"][number], index: number, input: NormalizedInput, source: AiDraftQuestion["source"], keywords: string[]): AiDraftQuestion {
  const adjusted = input.pastedNotes ? applyNotesSignals(stem, keywords) : stem;
  const type = pickQuestionType(index, input.questionTypes, adjusted.type);
  const fallbackAnswer = adjusted.correctAnswer ?? adjusted.options?.[adjusted.correctIndexes?.[0] ?? 0] ?? "Professor-reviewed correct answer";
  const normalizedOptionTexts = (() => {
    if (type === "True/False") {
      return ["True", "False"];
    }

    if (type === "MCQ Single" || type === "MCQ Multiple") {
      if (adjusted.options?.length) return adjusted.options;
      return [
        fallbackAnswer,
        "A partially correct distractor",
        "A common misconception",
        "An unrelated option"
      ];
    }

    return adjusted.options ?? [];
  })();
  const options = normalizedOptionTexts.map((text, optionIndex) => ({ id: `opt-${index + 1}-${optionIndex + 1}`, text }));
  const correctIndexes = (() => {
    if (type === "True/False") return [0];
    if (type === "MCQ Multiple") return adjusted.correctIndexes?.length ? adjusted.correctIndexes : [0, 1].filter((value) => value < options.length);
    if (type === "MCQ Single") return adjusted.correctIndexes?.length ? [adjusted.correctIndexes[0]] : [0];
    return adjusted.correctIndexes;
  })();
  const correctOptionIds = correctIndexes?.map((correctIndex) => options[correctIndex]?.id).filter(Boolean) as string[] | undefined;
  const difficulty = pickDifficulty(index, input.difficulty);
  const confidenceBase = input.pastedNotes ? 0.84 : input.topic ? 0.78 : 0.68;
  const confidence = Math.max(0.42, Math.min(0.97, confidenceBase - (input.pastedNotes && input.pastedNotes.length < 160 ? 0.16 : 0) - (type === "Fill in the Blank" ? 0.04 : 0)));

  const mappedOptions = type === "Short Answer" || type === "Fill in the Blank"
    ? [{ id: `opt-${index + 1}-1`, text: fallbackAnswer }]
    : options;

  return {
    tempId: `draft-${index + 1}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    text: adjusted.text,
    options: mappedOptions,
    correctOptionIds: type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False" ? correctOptionIds : undefined,
    correctAnswer: type === "Short Answer" || type === "Fill in the Blank" ? fallbackAnswer : undefined,
    explanation: adjusted.explanation,
    difficulty,
    topicTag: adjusted.topicTag,
    marks: input.marksPerQuestion,
    confidence: Number(confidence.toFixed(2)),
    source,
    aiGenerated: true
  };
}

function ensureStructuredQuestions(output: AiQuizGenerationOutput) {
  output.questions.forEach((question) => {
    if (question.type === "MCQ Single" || question.type === "MCQ Multiple" || question.type === "True/False") {
      if (!question.options.length) throw new Error("Generated MCQ questions must include options.");
      if (!question.correctOptionIds?.length) throw new Error("Generated MCQ questions must include correct answers.");
    }
  });
  return output;
}

async function recordInsight(type: AIInsightType, input: unknown, output: unknown, links: { userId?: string; classroomId?: string } = {}) {
  await prisma.aIInsight.create({
    data: {
      type,
      userId: links.userId,
      classroomId: links.classroomId,
      inputJson: JSON.stringify(input),
      outputJson: JSON.stringify(output)
    }
  });
}

function buildQuizOutput(input: NormalizedInput, type: AIInsightType): AiQuizGenerationOutput {
  const generationId = createGenerationId();
  const warnings: string[] = [];
  const keywords = deriveKeywords(input);
  const blueprint = detectBlueprint(input);
  const source: AiDraftQuestion["source"] = input.pastedNotes
    ? "Based on pasted notes"
    : input.topic
      ? "Based on topic prompt"
      : "General knowledge - review carefully";

  if (input.pastedNotes && input.pastedNotes.length < 160) {
    warnings.push("Pasted notes are short, so confidence is lower and wording may be more generic.");
  }

  if (!input.pastedNotes && !input.topic?.trim()) {
    warnings.push("Topic context is thin. Review each draft carefully before inserting it.");
  }

  if (input.avoidQuestionBankDuplicates) {
    warnings.push("Near-duplicate avoidance is mock-only for this phase and still needs professor review.");
  }

  const questions = Array.from({ length: input.questionCount }).map((_, index) => {
    const stem = blueprint.stems[index % blueprint.stems.length];
    return buildQuestion(stem, index, input, source, keywords);
  });

  return ensureStructuredQuestions({
    generationId,
    summary: type === AIInsightType.REMEDIAL_GENERATION
      ? `Drafted a lighter remedial set around ${input.topic ?? "the weak topic"} with professor review required.`
      : `Drafted ${questions.length} AI questions for ${input.topic ?? input.subject ?? "your topic"} with explanations and review guardrails.`,
    warnings,
    coverage: blueprint.coverage,
    estimatedDifficulty: input.difficulty,
    suggestedTimeMinutes: Math.max(5, questions.length * (input.mode === "analytics-remedial" ? 1 : 2)),
    questions
  });
}

export function mapAiDraftToQuizQuestion(question: AiDraftQuestion): QuizQuestion {
  const correctIndexes = question.correctOptionIds?.map((correctId) => question.options.findIndex((option) => option.id === correctId)).filter((value) => value >= 0) ?? [];
  const fallbackAnswer = question.correctAnswer ?? question.options[0]?.text ?? "Professor review required";
  const options = question.type === "Short Answer" || question.type === "Fill in the Blank"
    ? [fallbackAnswer]
    : question.options.map((option) => option.text);

  return {
    id: question.tempId,
    type: question.type === "MCQ Single" ? "MCQ Single Answer" : question.type === "MCQ Multiple" ? "Multiple Answer" : question.type,
    text: question.text,
    options,
    correct: correctIndexes[0] ?? 0,
    correctAnswers: correctIndexes,
    explanation: question.explanation,
    marks: question.marks,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false,
    sourceLabel: "AI Drafted" as const
  };
}

export function mapAiDraftToQuestionBankItem(question: AiDraftQuestion, context: { subject?: string; topic?: string; difficulty?: string }) {
  const correctSet = new Set(question.correctOptionIds ?? []);
  const options = question.type === "Short Answer" || question.type === "Fill in the Blank"
    ? [{ text: question.correctAnswer ?? "Professor review required", isCorrect: true }]
    : question.options.map((option) => ({ text: option.text, isCorrect: correctSet.has(option.id) }));

  return {
    subject: context.subject?.trim() || "General Studies",
    topic: context.topic?.trim() || question.topicTag,
    difficulty: context.difficulty ?? question.difficulty,
    type: question.type === "MCQ Single" ? "MCQ_SINGLE" : question.type === "MCQ Multiple" ? "MCQ_MULTIPLE" : "SHORT_ANSWER",
    text: question.text,
    explanation: question.explanation,
    marks: question.marks,
    options,
    aiGenerated: true
  };
}

export async function generateQuizDraft(input: AiQuizGenerationInput) {
  const normalized = sanitizeInput(input);
  const output = buildQuizOutput(normalized, AIInsightType.QUIZ_GENERATION);
  await recordInsight(
    AIInsightType.QUIZ_GENERATION,
    { ...normalized, pastedNotes: truncateForAudit(normalized.pastedNotes) },
    output,
    { userId: normalized.userId, classroomId: normalized.classId }
  );
  return output;
}

export async function generateRemedialQuiz(input: AiQuizGenerationInput) {
  const normalized = sanitizeInput({ ...input, mode: "analytics-remedial", difficulty: input.difficulty ?? "Easy", questionCount: input.questionCount ?? 5, tone: input.tone ?? "Exam-focused" });
  const output = buildQuizOutput(normalized, AIInsightType.REMEDIAL_GENERATION);
  await recordInsight(
    AIInsightType.REMEDIAL_GENERATION,
    { ...normalized, pastedNotes: truncateForAudit(normalized.pastedNotes) },
    output,
    { userId: normalized.userId, classroomId: normalized.classId }
  );
  return output;
}

export async function regenerateQuestion(input: AiQuizGenerationInput & { questionIndex?: number }) {
  const draft = await generateQuizDraft({ ...input, questionCount: Math.max(1, (input.questionIndex ?? 0) + 1) });
  const question = draft.questions[input.questionIndex ?? 0] ?? draft.questions[0];
  await recordInsight(
    AIInsightType.QUESTION_REGENERATION,
    { ...input, pastedNotes: truncateForAudit(input.pastedNotes) },
    question,
    { userId: input.userId, classroomId: input.classId }
  );
  return question;
}

export async function improveQuestion(input: { text?: string; tone?: AiTone; userId?: string }) {
  if (!input.text?.trim()) {
    throw new Error("Question text is required for improvement.");
  }

  const tone = input.tone ?? "Conceptual";
  const output = {
    text: `${input.text.trim().replace(/\?*$/, "")}? (${tone.toLowerCase()} wording, tightened for clarity)`,
    rationale: `Clarified wording for a ${tone.toLowerCase()} classroom review flow while keeping the same learning objective.`
  };

  await recordInsight(AIInsightType.QUESTION_IMPROVEMENT, input, output, { userId: input.userId });
  return output;
}

export async function generateExplanation(input: { question?: string; answer?: string; userId?: string }) {
  if (!input.question?.trim()) {
    throw new Error("Question text is required to generate an explanation.");
  }

  const output = {
    explanation: input.answer?.trim()
      ? `The best answer is ${input.answer.trim()} because it directly matches the concept being tested in the question. Review the key definition and one example before publishing.`
      : "The explanation should connect the correct answer back to the core concept, then give one brief reason the distractors are less suitable."
  };

  await recordInsight(AIInsightType.QUESTION_IMPROVEMENT, input, output, { userId: input.userId });
  return output;
}
