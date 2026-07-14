export type AiAgentMode = "quiz-builder" | "question-bank" | "analytics-remedial";
export type AiQuestionType = "MCQ Single" | "MCQ Multiple" | "True/False" | "Short Answer" | "Fill in the Blank";
export type AiDifficulty = "Easy" | "Medium" | "Hard" | "Mixed";
export type AiBloomLevel = "Recall" | "Understanding" | "Application" | "Analysis";
export type AiTone = "Simple" | "Exam-focused" | "Conceptual" | "Placement prep";
export type AiProviderName = "mock" | "claude" | "openrouter";
export type AiMaterialParser = "txt" | "markdown" | "pdf" | "docx" | "pptx" | "unsupported";
export type AiMaterialConfidence = "high" | "medium" | "low";

export type AiUploadedMaterialMetadata = {
  materialId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedCharCount: number;
  parser: AiMaterialParser;
  confidence: AiMaterialConfidence;
  previewText: string;
};

export type ParsedMaterialResult = AiUploadedMaterialMetadata & {
  extractedText: string;
  warnings: string[];
};

export type AiQuizGenerationInput = {
  mode: AiAgentMode;
  topic?: string;
  pastedNotes?: string;
  materialText?: string;
  materialMetadata?: AiUploadedMaterialMetadata;
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

export type NormalizedAiQuizGenerationInput =
  Required<Pick<AiQuizGenerationInput, "mode" | "questionCount" | "questionTypes" | "difficulty" | "bloomLevel" | "marksPerQuestion" | "negativeMarking" | "tone" | "avoidQuestionBankDuplicates">> &
  Pick<AiQuizGenerationInput, "topic" | "pastedNotes" | "materialText" | "materialMetadata" | "subject" | "classId" | "userId">;

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
  source: "Based on topic prompt" | "Based on pasted notes" | "Based on uploaded material" | "General knowledge - review carefully";
  aiGenerated: true;
};

export type AiProviderMetadata = {
  provider: AiProviderName;
  model: string;
  usedFallback: boolean;
  warnings: string[];
};

export type AiQuizGenerationOutput = {
  generationId: string;
  summary: string;
  warnings: string[];
  coverage: string[];
  estimatedDifficulty: AiDifficulty;
  suggestedTimeMinutes: number;
  questions: AiDraftQuestion[];
  provider: AiProviderMetadata;
};

export type AiExplanationOutput = {
  explanation: string;
  warnings: string[];
  provider: AiProviderMetadata;
};

export type AiQuestionImprovementOutput = {
  text: string;
  rationale: string;
  warnings: string[];
  provider: AiProviderMetadata;
};

export type AiProviderQuizDraftPayload = {
  summary?: string;
  warnings?: string[];
  coverage?: string[];
  estimatedDifficulty?: string;
  suggestedTimeMinutes?: number;
  questions?: unknown[];
};

export type AiProviderQuestionImprovementPayload = {
  text?: string;
  rationale?: string;
  warnings?: string[];
};

export type AiProviderExplanationPayload = {
  explanation?: string;
  warnings?: string[];
};

export type AiProviderExecution<T> = {
  data: T;
  provider: {
    provider: AiProviderName;
    model: string;
    warnings?: string[];
  };
};
