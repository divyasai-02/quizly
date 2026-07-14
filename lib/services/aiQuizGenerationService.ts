import { AIInsightType, NotificationType, UserRole } from "@prisma/client";
import type { QuizQuestion } from "@/data/mockData";
import { prisma } from "@/lib/prisma";
import { createNotification, createRoleNotifications } from "@/lib/services/notificationService";
import { resolveAiProviders } from "@/lib/services/ai/providers/aiProviderFactory";
import type {
  AiAgentMode,
  AiBloomLevel,
  AiDifficulty,
  AiDraftQuestion,
  AiExplanationOutput,
  AiUploadedMaterialMetadata,
  AiProviderMetadata,
  AiQuestionImprovementOutput,
  ParsedMaterialResult,
  AiQuestionType,
  AiQuizGenerationInput,
  AiQuizGenerationOutput,
  AiTone
} from "@/lib/services/ai/types";
import { truncateForAudit, validateExplanationPayload, validateQuestionImprovementPayload, validateQuizDraftPayload, sanitizeAiQuizGenerationInput } from "@/lib/services/ai/validation";

export type {
  AiAgentMode,
  AiBloomLevel,
  AiDifficulty,
  AiDraftQuestion,
  AiExplanationOutput,
  AiUploadedMaterialMetadata,
  AiProviderMetadata,
  AiQuestionImprovementOutput,
  ParsedMaterialResult,
  AiQuestionType,
  AiQuizGenerationInput,
  AiQuizGenerationOutput,
  AiTone
} from "@/lib/services/ai/types";

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

function buildAuditInput(input: AiQuizGenerationInput | ReturnType<typeof sanitizeAiQuizGenerationInput>["normalized"], requestedProvider: AiProviderMetadata["provider"]) {
  const materialMetadata = input.materialMetadata
    ? {
        ...input.materialMetadata,
        previewText: truncateForAudit(input.materialMetadata.previewText, 240)
      }
    : undefined;

  return {
    ...input,
    pastedNotes: truncateForAudit(input.pastedNotes),
    materialText: truncateForAudit(input.materialText),
    materialMetadata,
    requestedProvider
  };
}

function logProviderError(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown AI provider error";
  console.error(`[quizly-ai] ${operation} failed`, { message });
}

function normalizeDuplicateText(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_~()[\]{}:;'",.!?/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeDuplicateQuestion(left: string, right: string) {
  const normalizedLeft = normalizeDuplicateText(left);
  const normalizedRight = normalizeDuplicateText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  if (normalizedLeft === normalizedRight) return true;
  if (normalizedLeft.length > 24 && normalizedRight.includes(normalizedLeft)) return true;
  if (normalizedRight.length > 24 && normalizedLeft.includes(normalizedRight)) return true;

  const leftWords = new Set(normalizedLeft.split(" ").filter((word) => word.length > 3));
  const rightWords = new Set(normalizedRight.split(" ").filter((word) => word.length > 3));
  if (leftWords.size < 4 || rightWords.size < 4) return false;
  const overlap = [...leftWords].filter((word) => rightWords.has(word)).length;
  return overlap / Math.min(leftWords.size, rightWords.size) >= 0.82;
}

async function removeQuestionBankDuplicates(
  validated: ReturnType<typeof validateQuizDraftPayload>,
  normalized: ReturnType<typeof sanitizeAiQuizGenerationInput>["normalized"]
) {
  if (!normalized.avoidQuestionBankDuplicates || !normalized.userId || !validated.questions.length) {
    return validated;
  }

  const bankItems = await prisma.questionBankItem.findMany({
    where: { professorId: normalized.userId },
    select: { text: true }
  });
  if (!bankItems.length) return validated;

  const filtered = validated.questions.filter((question) =>
    !bankItems.some((item) => looksLikeDuplicateQuestion(question.text, item.text))
  );
  const removedCount = validated.questions.length - filtered.length;
  if (!removedCount) return validated;

  return {
    ...validated,
    questions: filtered.length ? filtered : validated.questions.slice(0, 1),
    warnings: [
      ...validated.warnings,
      filtered.length
        ? `Removed ${removedCount} near-duplicate question${removedCount === 1 ? "" : "s"} already present in your question bank.`
        : `Detected ${removedCount} near-duplicate question${removedCount === 1 ? "" : "s"} in your question bank; kept one draft so you can revise it manually.`
    ]
  };
}

async function recordGenerationNotifications(
  operation: "generateQuizDraft" | "generateRemedialQuiz" | "regenerateQuestion",
  normalized: ReturnType<typeof sanitizeAiQuizGenerationInput>["normalized"],
  output: AiQuizGenerationOutput
) {
  if (operation === "regenerateQuestion" || !normalized.userId) {
    return;
  }

  const avgConfidence = output.questions.length
    ? output.questions.reduce((total, question) => total + question.confidence, 0) / output.questions.length
    : 1;
  const hasLowConfidence = output.provider.usedFallback || output.warnings.length > 0 || avgConfidence < 0.75;
  const actionUrl = operation === "generateRemedialQuiz" ? "/professor/analytics" : "/professor/create-quiz";
  const topicLabel = normalized.topic?.trim() || normalized.materialMetadata?.fileName || "your latest request";

  try {
    await createNotification({
      userId: normalized.userId,
      role: UserRole.PROFESSOR,
      context: operation === "generateRemedialQuiz" ? "analytics-remedial" : "quiz-builder",
      type: NotificationType.AI_QUIZ_GENERATED,
      title: operation === "generateRemedialQuiz" ? "Remedial quiz ready" : "AI quiz draft ready",
      message: operation === "generateRemedialQuiz"
        ? `A remedial quiz for ${topicLabel} is ready to review and assign.`
        : `Your AI-generated quiz draft for ${topicLabel} is ready in the builder.`,
      actionUrl
    });

    await createRoleNotifications(UserRole.ADMIN, {
      context: operation === "generateRemedialQuiz" ? "analytics-remedial" : "quiz-builder",
      type: NotificationType.ADMIN_AI_GENERATION_CREATED,
      title: "New AI generation created",
      message: `A professor generated ${output.questions.length} AI question${output.questions.length === 1 ? "" : "s"} for ${topicLabel}.`,
      actionUrl: "/admin/ai-moderation"
    });

    if (hasLowConfidence) {
      await createRoleNotifications(UserRole.ADMIN, {
        context: "ai-moderation",
        type: NotificationType.ADMIN_LOW_CONFIDENCE_AI_GENERATION,
        title: "AI generation needs review",
        message: `The latest ${topicLabel} generation produced warnings or lower-confidence output and should be reviewed.`,
        actionUrl: "/admin/ai-moderation"
      });
    }
  } catch (error) {
    console.error("[quizly-notifications] failed to record AI generation notifications", error);
  }
}

async function executeQuizOperation(
  operation: "generateQuizDraft",
  type: AIInsightType,
  input: AiQuizGenerationInput & { questionIndex?: number }
): Promise<AiQuizGenerationOutput>;
async function executeQuizOperation(
  operation: "generateRemedialQuiz",
  type: AIInsightType,
  input: AiQuizGenerationInput & { questionIndex?: number }
): Promise<AiQuizGenerationOutput>;
async function executeQuizOperation(
  operation: "regenerateQuestion",
  type: AIInsightType,
  input: AiQuizGenerationInput & { questionIndex?: number }
): Promise<AiDraftQuestion>;
async function executeQuizOperation(
  operation: "generateQuizDraft" | "generateRemedialQuiz" | "regenerateQuestion",
  type: AIInsightType,
  input: AiQuizGenerationInput & { questionIndex?: number }
) {
  const { normalized, warnings: inputWarnings } = sanitizeAiQuizGenerationInput(
    operation === "generateRemedialQuiz"
      ? {
          ...input,
          mode: "analytics-remedial",
          difficulty: input.difficulty ?? "Easy",
          questionCount: input.questionCount ?? 5,
          tone: input.tone ?? "Exam-focused"
        }
      : operation === "regenerateQuestion"
        ? { ...input, questionCount: Math.max(1, (input.questionIndex ?? 0) + 1) }
        : input
  );

  const providers = resolveAiProviders();
  const factoryWarnings = [...providers.factoryWarnings];

  const finalize = (
    validated: ReturnType<typeof validateQuizDraftPayload>,
    provider: { provider: AiProviderMetadata["provider"]; model: string; warnings?: string[] },
    usedFallback: boolean,
    fallbackWarnings: string[] = []
  ) => {
    const providerWarnings = [...factoryWarnings, ...(provider.warnings ?? []), ...inputWarnings, ...fallbackWarnings];
    const mergedWarnings = [...validated.warnings, ...providerWarnings];
    const output: AiQuizGenerationOutput = {
      generationId: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      summary: validated.summary,
      warnings: mergedWarnings,
      coverage: validated.coverage,
      estimatedDifficulty: validated.estimatedDifficulty,
      suggestedTimeMinutes: validated.suggestedTimeMinutes,
      questions: validated.questions,
      provider: {
        provider: provider.provider,
        model: provider.model,
        usedFallback,
        warnings: providerWarnings
      }
    };
    return output;
  };

  try {
    const primaryResult = await providers.provider[operation](input);
    const questionIndex = operation === "regenerateQuestion" ? input.questionIndex ?? 0 : undefined;
    const validated = await removeQuestionBankDuplicates(validateQuizDraftPayload(primaryResult.data, normalized), normalized);
    const output = finalize(validated, primaryResult.provider, false);
    const result = operation === "regenerateQuestion"
      ? output.questions[questionIndex ?? 0] ?? output.questions[0]
      : output;

    await recordInsight(
      type,
      buildAuditInput(normalized, providers.requestedProvider),
      result,
      { userId: normalized.userId, classroomId: normalized.classId }
    );

    if (operation !== "regenerateQuestion") {
      await recordGenerationNotifications(operation, normalized, output);
    }

    return result;
  } catch (primaryError) {
    if (providers.provider === providers.fallback) {
      throw primaryError;
    }

    logProviderError(operation, primaryError);
    const fallbackResult = await providers.fallback[operation](input);
    const questionIndex = operation === "regenerateQuestion" ? input.questionIndex ?? 0 : undefined;
    const validated = await removeQuestionBankDuplicates(validateQuizDraftPayload(fallbackResult.data, normalized), normalized);
    const output = finalize(
      validated,
      fallbackResult.provider,
      true,
      ["The configured AI provider was unavailable or returned invalid output. Mock fallback was used safely."]
    );
    const result = operation === "regenerateQuestion"
      ? output.questions[questionIndex ?? 0] ?? output.questions[0]
      : output;

    await recordInsight(
      type,
      buildAuditInput(normalized, providers.requestedProvider),
      result,
      { userId: normalized.userId, classroomId: normalized.classId }
    );

    if (operation !== "regenerateQuestion") {
      await recordGenerationNotifications(operation, normalized, output);
    }

    return result;
  }
}

async function executeSimpleOperation<TValidated extends object & { warnings: string[] }>(
  operation: "generateExplanation" | "improveQuestion",
  type: AIInsightType,
  input: { question?: string; answer?: string; text?: string; tone?: AiTone; userId?: string },
  validate: (payload: any) => TValidated,
) {
  const providers = resolveAiProviders();
  const finalize = (
    validated: TValidated,
    provider: { provider: AiProviderMetadata["provider"]; model: string; warnings?: string[] },
    usedFallback: boolean,
    fallbackWarnings: string[] = []
  ) => ({
    ...validated,
    warnings: [...validated.warnings, ...providers.factoryWarnings, ...(provider.warnings ?? []), ...fallbackWarnings],
    provider: {
      provider: provider.provider,
      model: provider.model,
      usedFallback,
      warnings: [...providers.factoryWarnings, ...(provider.warnings ?? []), ...fallbackWarnings]
    } satisfies AiProviderMetadata
  });

  try {
    const primaryResult = await providers.provider[operation](input as never);
    const validated = validate(primaryResult.data);
    const output = finalize(validated, primaryResult.provider, false);
    await recordInsight(type, input, output, { userId: input.userId });
    return output;
  } catch (primaryError) {
    if (providers.provider === providers.fallback) {
      throw primaryError;
    }
    logProviderError(operation, primaryError);
    const fallbackResult = await providers.fallback[operation](input as never);
    const validated = validate(fallbackResult.data);
    const output = finalize(validated, fallbackResult.provider, true, ["The configured AI provider was unavailable or returned invalid output. Mock fallback was used safely."]);
    await recordInsight(type, input, output, { userId: input.userId });
    return output;
  }
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
  return executeQuizOperation("generateQuizDraft", AIInsightType.QUIZ_GENERATION, input);
}

export async function generateRemedialQuiz(input: AiQuizGenerationInput) {
  return executeQuizOperation("generateRemedialQuiz", AIInsightType.REMEDIAL_GENERATION, input);
}

export async function regenerateQuestion(input: AiQuizGenerationInput & { questionIndex?: number }) {
  return executeQuizOperation("regenerateQuestion", AIInsightType.QUESTION_REGENERATION, input);
}

export async function improveQuestion(input: { text?: string; tone?: AiTone; userId?: string }) {
  if (!input.text?.trim()) {
    throw new Error("Question text is required for improvement.");
  }

  return executeSimpleOperation<Omit<AiQuestionImprovementOutput, "provider">>(
    "improveQuestion",
    AIInsightType.QUESTION_IMPROVEMENT,
    input,
    (payload) => validateQuestionImprovementPayload(payload, input.text!.trim())
  );
}

export async function generateExplanation(input: { question?: string; answer?: string; userId?: string }) {
  if (!input.question?.trim()) {
    throw new Error("Question text is required to generate an explanation.");
  }

  return executeSimpleOperation<Omit<AiExplanationOutput, "provider">>(
    "generateExplanation",
    AIInsightType.QUESTION_IMPROVEMENT,
    input,
    validateExplanationPayload
  );
}
