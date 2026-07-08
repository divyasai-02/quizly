export type ScoringQuestion = {
  id: string;
  marks: number;
  negativeMarks: number;
  options: Array<{ id: string; isCorrect: boolean }>;
};

export type AnswerInput = {
  questionId: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
  markedForReview?: boolean;
};

export function scoreAttempt(questions: ScoringQuestion[], answers: AnswerInput[]) {
  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer]));
  let score = 0;

  const graded = questions.map((question) => {
    const answer = answerByQuestion.get(question.id);
    const selected = new Set(answer?.selectedOptionIds ?? []);
    const correct = new Set(question.options.filter((option) => option.isCorrect).map((option) => option.id));
    const isAnswered = selected.size > 0 || !!answer?.textAnswer;
    const isCorrect =
      isAnswered &&
      selected.size === correct.size &&
      [...correct].every((optionId) => selected.has(optionId));
    const marksAwarded = isCorrect ? question.marks : isAnswered ? -question.negativeMarks : 0;
    score += marksAwarded;

    return {
      questionId: question.id,
      selectedOptionIds: [...selected],
      textAnswer: answer?.textAnswer,
      isCorrect,
      marksAwarded,
      markedForReview: !!answer?.markedForReview
    };
  });

  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  const percentage = totalMarks > 0 ? Math.max(0, (score / totalMarks) * 100) : 0;

  return {
    score: Math.max(0, score),
    totalMarks,
    percentage,
    graded
  };
}
