type QuestionInput = {
  type?: string;
  text?: string;
  options?: string[];
  correct?: number;
  correctOptionIndexes?: number[];
  marks?: number;
  negativeMarks?: number;
  minutes?: number;
  seconds?: number;
};

type QuestionBankInput = {
  type?: string;
  text?: string;
  subject?: string;
  topic?: string;
  explanation?: string;
  marks?: number;
  options?: Array<{ text?: string; isCorrect?: boolean }>;
};

export function validateQuizTitle(title?: string) {
  if (!title || !title.trim()) {
    throw new Error("Quiz title is required.");
  }
}

export function validateQuestionInput(question: QuestionInput) {
  if (!question.text?.trim()) {
    throw new Error("Question text is required.");
  }
  if ((question.marks ?? 1) <= 0) {
    throw new Error("Marks must be positive.");
  }
  if ((question.negativeMarks ?? 0) < 0) {
    throw new Error("Negative marks cannot be below zero.");
  }
  if ((question.minutes ?? 0) < 0 || (question.seconds ?? 0) < 0) {
    throw new Error("Time limits cannot be negative.");
  }

  const isMcq = !question.type || question.type.includes("MCQ") || question.type.includes("Multiple") || question.type.includes("True/False");
  if (isMcq) {
    if (!question.options || question.options.length < 2) {
      throw new Error("MCQ questions must have at least two options.");
    }
    const correctIndexes = question.correctOptionIndexes ?? [question.correct ?? -1];
    if (!correctIndexes.some((index) => index >= 0 && index < (question.options?.length ?? 0))) {
      throw new Error("MCQ questions must have at least one correct option.");
    }
  }
}

export function validateQuestionBankItemInput(question: QuestionBankInput) {
  if (!question.text?.trim()) {
    throw new Error("Question text is required.");
  }
  if (!question.subject?.trim()) {
    throw new Error("Subject is required.");
  }
  if (!question.topic?.trim()) {
    throw new Error("Topic is required.");
  }
  if ((question.marks ?? 1) <= 0) {
    throw new Error("Marks must be positive.");
  }

  const isMcq = !question.type || question.type.includes("MCQ") || question.type.includes("Multiple") || question.type.includes("True/False");
  if (isMcq) {
    if (!question.options || question.options.length < 2) {
      throw new Error("MCQ questions must have at least two options.");
    }
    if (question.options.some((option) => !option.text?.trim())) {
      throw new Error("Each option must include text.");
    }
    if (!question.options.some((option) => option.isCorrect)) {
      throw new Error("MCQ questions must have at least one correct option.");
    }
  }
}

export function validatePublish(questions: Array<{ options: Array<{ isCorrect: boolean }>; marks: number }>) {
  if (questions.length === 0) {
    throw new Error("Add at least one question before publishing.");
  }
  for (const question of questions) {
    if (question.marks <= 0) {
      throw new Error("Every question must have positive marks.");
    }
    if (question.options.length > 0 && !question.options.some((option) => option.isCorrect)) {
      throw new Error("Every MCQ must have at least one correct option.");
    }
  }
}
