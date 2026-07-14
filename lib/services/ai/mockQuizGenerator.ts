import { AIInsightType } from "@prisma/client";
import type {
  AiAgentMode,
  AiDraftQuestion,
  AiProviderExplanationPayload,
  AiProviderQuestionImprovementPayload,
  AiProviderQuizDraftPayload,
  AiQuestionType,
  NormalizedAiQuizGenerationInput
} from "@/lib/services/ai/types";

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

export function createGenerationId() {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveKeywords(input: Pick<NormalizedAiQuizGenerationInput, "topic" | "pastedNotes" | "materialText">) {
  const source = `${input.topic ?? ""} ${input.materialText ?? ""} ${input.pastedNotes ?? ""}`.toLowerCase();
  return Array.from(
    new Set(
      source
        .split(/[^a-z0-9+#.]+/i)
        .map((value) => value.trim())
        .filter((value) => value.length >= 4)
    )
  ).slice(0, 8);
}

function detectBlueprint(input: NormalizedAiQuizGenerationInput): TopicBlueprint {
  const source = `${input.topic ?? ""} ${input.materialText ?? ""} ${input.pastedNotes ?? ""}`.toLowerCase();

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

function pickDifficulty(index: number, requested: NormalizedAiQuizGenerationInput["difficulty"]) {
  if (requested !== "Mixed") return requested;
  const rotation: Array<"Easy" | "Medium" | "Hard"> = ["Easy", "Medium", "Hard"];
  return rotation[index % rotation.length];
}

function pickQuestionType(index: number, requested: AiQuestionType[], fallback: AiQuestionType) {
  return requested[index % requested.length] ?? fallback;
}

function buildQuestion(
  stem: TopicBlueprint["stems"][number],
  index: number,
  input: NormalizedAiQuizGenerationInput,
  source: AiDraftQuestion["source"],
  keywords: string[]
) {
  const adjusted = input.pastedNotes || input.materialText ? applyNotesSignals(stem, keywords) : stem;
  const type = pickQuestionType(index, input.questionTypes, adjusted.type);
  const fallbackAnswer = adjusted.correctAnswer ?? adjusted.options?.[adjusted.correctIndexes?.[0] ?? 0] ?? "Professor-reviewed correct answer";
  const normalizedOptionTexts = (() => {
    if (type === "True/False") return ["True", "False"];
    if (type === "MCQ Single" || type === "MCQ Multiple") {
      if (adjusted.options?.length) return adjusted.options;
      return [fallbackAnswer, "A partially correct distractor", "A common misconception", "An unrelated option"];
    }
    return adjusted.options ?? [];
  })();

  const options = normalizedOptionTexts.map((text, optionIndex) => ({
    id: `opt-${index + 1}-${optionIndex + 1}`,
    text
  }));
  const correctIndexes = (() => {
    if (type === "True/False") return [0];
    if (type === "MCQ Multiple") return adjusted.correctIndexes?.length ? adjusted.correctIndexes : [0, 1].filter((value) => value < options.length);
    if (type === "MCQ Single") return adjusted.correctIndexes?.length ? [adjusted.correctIndexes[0]] : [0];
    return adjusted.correctIndexes;
  })();

  const confidenceBase = input.materialText ? 0.88 : input.pastedNotes ? 0.84 : input.topic ? 0.78 : 0.68;
  const confidence = Math.max(
    0.42,
    Math.min(0.97, confidenceBase - (((input.materialText && input.materialText.length < 160) || (input.pastedNotes && input.pastedNotes.length < 160)) ? 0.16 : 0) - (type === "Fill in the Blank" ? 0.04 : 0))
  );

  return {
    type,
    text: adjusted.text,
    options: type === "Short Answer" || type === "Fill in the Blank" ? [{ text: fallbackAnswer }] : options.map((option) => ({ text: option.text })),
    correctOptionIndexes: type === "MCQ Single" || type === "MCQ Multiple" || type === "True/False" ? correctIndexes : undefined,
    correctAnswer: type === "Short Answer" || type === "Fill in the Blank" ? fallbackAnswer : undefined,
    explanation: adjusted.explanation,
    difficulty: pickDifficulty(index, input.difficulty),
    topicTag: adjusted.topicTag,
    marks: input.marksPerQuestion,
    confidence: Number(confidence.toFixed(2)),
    source,
    aiGenerated: true
  };
}

export function buildMockQuizPayload(input: NormalizedAiQuizGenerationInput, type: AIInsightType): AiProviderQuizDraftPayload {
  const warnings: string[] = [];
  const keywords = deriveKeywords(input);
  const blueprint = detectBlueprint(input);
  const source: AiDraftQuestion["source"] = input.materialText
    ? "Based on uploaded material"
    : input.pastedNotes
    ? "Based on pasted notes"
    : input.topic
      ? "Based on topic prompt"
      : "General knowledge - review carefully";

  if (input.materialText && input.materialText.length < 160) {
    warnings.push("Uploaded material is short, so confidence is lower and wording may be more generic.");
  } else if (input.pastedNotes && input.pastedNotes.length < 160) {
    warnings.push("Pasted notes are short, so confidence is lower and wording may be more generic.");
  }
  if (!input.pastedNotes && !input.topic?.trim()) {
    warnings.push("Topic context is thin. Review each draft carefully before inserting it.");
  }
  return {
    summary: type === AIInsightType.REMEDIAL_GENERATION
      ? `Drafted a lighter remedial set around ${input.topic ?? "the weak topic"} with professor review required.`
      : `Drafted ${input.questionCount} AI questions for ${input.topic ?? input.subject ?? input.materialMetadata?.fileName ?? "your topic"} with explanations and review guardrails.`,
    warnings,
    coverage: blueprint.coverage,
    estimatedDifficulty: input.difficulty,
    suggestedTimeMinutes: Math.max(5, input.questionCount * (input.mode === "analytics-remedial" ? 1 : 2)),
    questions: Array.from({ length: input.questionCount }).map((_, index) => buildQuestion(blueprint.stems[index % blueprint.stems.length], index, input, source, keywords))
  };
}

export function buildMockQuestionImprovement(input: { text?: string; tone?: string }): AiProviderQuestionImprovementPayload {
  return {
    text: `${input.text?.trim().replace(/\?*$/, "")}? (${(input.tone ?? "Conceptual").toLowerCase()} wording, tightened for clarity)`,
    rationale: `Clarified wording for a ${(input.tone ?? "Conceptual").toLowerCase()} classroom review flow while keeping the same learning objective.`
  };
}

export function buildMockExplanation(input: { question?: string; answer?: string }): AiProviderExplanationPayload {
  return {
    explanation: input.answer?.trim()
      ? `The best answer is ${input.answer.trim()} because it directly matches the concept being tested in the question. Review the key definition and one example before publishing.`
      : "The explanation should connect the correct answer back to the core concept, then give one brief reason the distractors are less suitable."
  };
}
