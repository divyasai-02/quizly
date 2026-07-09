type ReviewQuestionInput = {
  id: string;
  text: string;
  topicTag?: string | null;
  difficulty?: string | null;
  explanation?: string | null;
  marks: number;
  sourceLabel?: string | null;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
};

type ReviewAnswerInput = {
  questionId: string;
  textAnswer?: string | null;
  isCorrect?: boolean | null;
  marksAwarded: number;
  markedForReview: boolean;
  selectedOptionIds: string[];
};

type ReviewAttemptInput = {
  id: string;
  score: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds?: number | null;
  status: string;
  createdAt?: Date;
  startedAt?: Date;
  submittedAt?: Date | null;
  quiz: {
    id: string;
    title: string;
    subject: string;
    topic: string;
    difficulty: string;
    timeLimitMinutes: number;
    totalMarks: number;
    passingMarks: number;
    questions: ReviewQuestionInput[];
  };
  answers: ReviewAnswerInput[];
};

type StudentAttemptSummary = {
  id: string;
  quizId: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  percentage: number;
  score: number;
  passed: boolean;
  status: string;
  timeTakenSeconds?: number | null;
  suggestedTimeMinutes?: number | null;
  createdAt: Date;
};

type PracticeSourceQuestion = {
  id: string;
  text: string;
  explanation?: string | null;
  subject: string;
  topic: string;
  difficulty: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  source: "question-bank" | "missed-question";
};

export type ReviewQuestion = {
  id: string;
  text: string;
  topic: string;
  difficulty: string;
  status: "Correct" | "Incorrect" | "Unanswered";
  selectedAnswer: string[];
  selectedAnswerText?: string;
  correctAnswer: string[];
  explanation: string;
  marksAwarded: number;
  totalMarks: number;
  markedForReview: boolean;
  isCorrect: boolean;
  isAnswered: boolean;
  options: Array<{
    id: string;
    text: string;
    selected: boolean;
    correct: boolean;
    incorrectSelected: boolean;
  }>;
  practiceTopic: string;
};

export type TopicPerformance = {
  topic: string;
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  weakScore: number;
  recommendedQuestionCount: number;
  difficulty: string;
};

export type BadgeProgress = {
  name: string;
  unlocked: boolean;
  progress: number;
  criteria: string;
  tone: "green" | "amber" | "purple" | "blue" | "pink";
};

export type LearningSummary = {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  topic: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  markedForReviewCount: number;
  timeTakenSeconds: number;
  weakTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  recommendedRevisionSteps: string[];
  practiceRecommendations: Array<{
    topic: string;
    subject: string;
    reason: string;
    questionCount: number;
    difficulty: string;
  }>;
  xpEarned: number;
  badgeUnlockSuggestions: string[];
  badgesUnlocked: string[];
  classAverage: number;
  percentile: number;
  feedback: {
    overall: string;
    strongTopics: string[];
    weakTopics: string[];
    revisionSteps: string[];
    recommendedPracticeSet: string;
  };
  reviewQuestions: ReviewQuestion[];
};

export type PracticeQuestion = {
  id: string;
  text: string;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
  options: Array<{ id: string; text: string }>;
  correctOptionIds: string[];
  source: "question-bank" | "missed-question";
};

const PRACTICE_FALLBACK_TOPICS = new Set(["", "all", "general", "mixed", "recommended"]);
const PRACTICE_STOP_WORDS = new Set(["basics", "basic", "fundamentals", "fundamental", "general", "overview", "intro", "introduction", "topic"]);

function tokenizePracticeText(value: string) {
  return value
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token && !PRACTICE_STOP_WORDS.has(token));
}

export function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 400) + 1);
}

export function calculateXpForAttempt(input: { score: number; percentage: number; passed: boolean; totalMarks: number; timeTakenSeconds?: number | null; suggestedTimeMinutes?: number | null }) {
  const completionXp = 60;
  const scoreBonus = Math.round(input.score * 18);
  const accuracyBonus = Math.round(input.percentage * 0.6);
  const passBonus = input.passed ? 30 : 0;
  const perfectBonus = input.percentage >= 100 ? 40 : 0;
  const speedThreshold = (input.suggestedTimeMinutes ?? 0) > 0 ? (input.suggestedTimeMinutes ?? 0) * 60 : null;
  const speedBonus = speedThreshold && (input.timeTakenSeconds ?? Number.MAX_SAFE_INTEGER) <= speedThreshold ? 20 : 0;
  return completionXp + scoreBonus + accuracyBonus + passBonus + perfectBonus + speedBonus;
}

export function calculateProgressBadges(attempts: StudentAttemptSummary[]) {
  const completed = attempts.filter((attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED");
  const xp = completed.reduce((total, attempt) => total + calculateXpForAttempt({
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
    totalMarks: Math.max(1, attempt.score),
    timeTakenSeconds: attempt.timeTakenSeconds,
    suggestedTimeMinutes: attempt.suggestedTimeMinutes
  }), 0);
  const averageScore = completed.length ? completed.reduce((total, attempt) => total + attempt.percentage, 0) / completed.length : 0;
  const multiDayCount = new Set(completed.map((attempt) => attempt.createdAt.toISOString().slice(0, 10))).size;
  const improved = completed.some((attempt, index) => index > 0 && attempt.percentage > completed[index - 1].percentage && completed[index - 1].percentage < 60);
  const accuracyAce = completed.some((attempt) => attempt.percentage >= 90);
  const speedCount = completed.filter((attempt) => {
    const suggested = (attempt.suggestedTimeMinutes ?? 0) * 60;
    return suggested > 0 && (attempt.timeTakenSeconds ?? Number.MAX_SAFE_INTEGER) <= suggested;
  }).length;

  const badges: BadgeProgress[] = [
    {
      name: "Quiz Master",
      unlocked: completed.length >= 5,
      progress: Math.min(100, Math.round((completed.length / 5) * 100)),
      criteria: "Complete 5 quizzes",
      tone: "purple"
    },
    {
      name: "Knowledgeable",
      unlocked: averageScore >= 80,
      progress: Math.min(100, Math.round((averageScore / 80) * 100)),
      criteria: "Maintain an average score above 80%",
      tone: "green"
    },
    {
      name: "Speed Solver",
      unlocked: speedCount >= 1,
      progress: Math.min(100, speedCount > 0 ? 100 : 35),
      criteria: "Finish a quiz within the suggested time",
      tone: "amber"
    },
    {
      name: "Consistency Star",
      unlocked: multiDayCount >= 3,
      progress: Math.min(100, Math.round((multiDayCount / 3) * 100)),
      criteria: "Complete quizzes across multiple days",
      tone: "blue"
    },
    {
      name: "Comeback Learner",
      unlocked: improved,
      progress: improved ? 100 : Math.min(90, completed.length * 18),
      criteria: "Improve after a weaker attempt",
      tone: "pink"
    },
    {
      name: "Accuracy Ace",
      unlocked: accuracyAce,
      progress: Math.min(100, Math.round((averageScore / 90) * 100)),
      criteria: "Score 90% or above",
      tone: "green"
    }
  ];

  return {
    xp,
    level: calculateLevel(xp),
    badges
  };
}

function deriveTopic(question: ReviewQuestionInput, quiz: ReviewAttemptInput["quiz"]) {
  return question.topicTag?.trim() || quiz.topic || quiz.subject;
}

function deriveDifficulty(question: ReviewQuestionInput, quiz: ReviewAttemptInput["quiz"]) {
  return question.difficulty?.trim() || quiz.difficulty || "Medium";
}

export function mapAttemptReview(attempt: ReviewAttemptInput): ReviewQuestion[] {
  const answerMap = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));
  return attempt.quiz.questions.map((question) => {
    const answer = answerMap.get(question.id);
    const selectedOptions = answer?.selectedOptionIds ?? [];
    const selectedTexts = question.options.filter((option) => selectedOptions.includes(option.id)).map((option) => option.text);
    const correctTexts = question.options.filter((option) => option.isCorrect).map((option) => option.text);
    const textFallback = answer?.textAnswer?.trim();
    const isAnswered = selectedOptions.length > 0 || !!textFallback;
    const isCorrect = !!answer?.isCorrect;
    const status: ReviewQuestion["status"] = !isAnswered ? "Unanswered" : isCorrect ? "Correct" : "Incorrect";

    return {
      id: question.id,
      text: question.text,
      topic: deriveTopic(question, attempt.quiz),
      difficulty: deriveDifficulty(question, attempt.quiz),
      status,
      selectedAnswer: selectedTexts,
      selectedAnswerText: textFallback,
      correctAnswer: correctTexts.length ? correctTexts : [question.explanation ?? "Professor review required"],
      explanation: question.explanation ?? "Review the core concept before attempting similar questions.",
      marksAwarded: answer?.marksAwarded ?? 0,
      totalMarks: question.marks,
      markedForReview: !!answer?.markedForReview,
      isCorrect,
      isAnswered,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text,
        selected: selectedOptions.includes(option.id),
        correct: option.isCorrect,
        incorrectSelected: selectedOptions.includes(option.id) && !option.isCorrect
      })),
      practiceTopic: deriveTopic(question, attempt.quiz)
    };
  });
}

export function calculateTopicPerformance(reviewQuestions: ReviewQuestion[], subject: string) {
  const topicMap = new Map<string, TopicPerformance>();
  for (const question of reviewQuestions) {
    const topic = question.topic || subject;
    const existing = topicMap.get(topic) ?? {
      topic,
      subject,
      total: 0,
      correct: 0,
      incorrect: 0,
      unanswered: 0,
      accuracy: 0,
      weakScore: 0,
      recommendedQuestionCount: 4,
      difficulty: question.difficulty || "Medium"
    };
    existing.total += 1;
    if (!question.isAnswered) existing.unanswered += 1;
    else if (question.isCorrect) existing.correct += 1;
    else existing.incorrect += 1;
    existing.difficulty = question.difficulty || existing.difficulty;
    topicMap.set(topic, existing);
  }

  return [...topicMap.values()].map((topic) => {
    topic.accuracy = topic.total ? Math.round((topic.correct / topic.total) * 100) : 0;
    topic.weakScore = Math.max(0, 100 - topic.accuracy);
    topic.recommendedQuestionCount = Math.min(10, Math.max(3, topic.incorrect + topic.unanswered + 2));
    return topic;
  });
}

function buildRevisionSteps(weakTopics: TopicPerformance[], reviewQuestions: ReviewQuestion[]) {
  if (!weakTopics.length) {
    return [
      "Review one strong topic explanation to reinforce what is already working.",
      "Try a short mixed practice set to keep recall sharp.",
      "Attempt a slightly harder quiz when you are ready."
    ];
  }

  const firstWeak = weakTopics[0];
  const weakQuestion = reviewQuestions.find((question) => question.topic === firstWeak.topic && !question.isCorrect);
  return [
    `Revisit ${firstWeak.topic} and rewrite the rule behind the questions you missed.`,
    weakQuestion
      ? `Compare your answer on "${weakQuestion.text}" with the explanation before reattempting similar practice.`
      : `Answer a short ${firstWeak.topic} practice set with focus on explanation reading.`,
    `Finish a ${firstWeak.recommendedQuestionCount}-question practice loop on ${firstWeak.topic} to check improvement.`
  ];
}

function buildOverallFeedback(percentage: number, weakTopics: TopicPerformance[], strongTopics: TopicPerformance[]) {
  if (percentage >= 85) {
    return `Strong performance overall. Keep momentum by reinforcing ${strongTopics[0]?.topic ?? "your strongest topic"} and stretching into one harder practice round.`;
  }
  if (percentage >= 60) {
    return `Good foundation with a few repair points. The biggest gain will come from tightening ${weakTopics[0]?.topic ?? "your weaker topics"} and reviewing why distractors were tempting.`;
  }
  return `This attempt shows where to focus next. Slow the pace, rebuild ${weakTopics[0]?.topic ?? "the core topic"} step by step, and use short feedback-driven practice before the next timed quiz.`;
}

export function summarizeAttemptLearning(input: {
  attempt: ReviewAttemptInput;
  classAverage?: number;
  percentile?: number;
  historicalAttempts?: StudentAttemptSummary[];
}) : LearningSummary {
  const reviewQuestions = mapAttemptReview(input.attempt);
  const correctCount = reviewQuestions.filter((question) => question.isCorrect).length;
  const incorrectCount = reviewQuestions.filter((question) => question.isAnswered && !question.isCorrect).length;
  const unansweredCount = reviewQuestions.filter((question) => !question.isAnswered).length;
  const markedForReviewCount = reviewQuestions.filter((question) => question.markedForReview).length;
  const topics = calculateTopicPerformance(reviewQuestions, input.attempt.quiz.subject);
  const weakTopics = topics.filter((topic) => topic.accuracy < 70).sort((a, b) => b.weakScore - a.weakScore);
  const strongTopics = topics.filter((topic) => topic.accuracy >= 70).sort((a, b) => b.accuracy - a.accuracy);
  const recommendedRevisionSteps = buildRevisionSteps(weakTopics, reviewQuestions);
  const xpEarned = calculateXpForAttempt({
    score: input.attempt.score,
    percentage: input.attempt.percentage,
    passed: input.attempt.passed,
    totalMarks: input.attempt.quiz.totalMarks,
    timeTakenSeconds: input.attempt.timeTakenSeconds,
    suggestedTimeMinutes: input.attempt.quiz.timeLimitMinutes
  });
  const progress = calculateProgressBadges(input.historicalAttempts ?? []);
  const badgesUnlocked = progress.badges.filter((badge) => badge.unlocked).map((badge) => badge.name);
  const badgeUnlockSuggestions = progress.badges.filter((badge) => !badge.unlocked).slice(0, 2).map((badge) => `${badge.name}: ${badge.criteria}`);
  const practiceRecommendations = (weakTopics.length ? weakTopics : topics.slice(0, 2)).map((topic) => ({
    topic: topic.topic,
    subject: topic.subject,
    reason: topic.accuracy < 70 ? `Accuracy is ${topic.accuracy}% here, so this is your best recovery topic.` : `This topic is still worth reinforcing while it is fresh.`,
    questionCount: topic.recommendedQuestionCount,
    difficulty: topic.accuracy < 50 ? "Easy" : topic.difficulty
  }));

  return {
    attemptId: input.attempt.id,
    quizId: input.attempt.quiz.id,
    quizTitle: input.attempt.quiz.title,
    subject: input.attempt.quiz.subject,
    topic: input.attempt.quiz.topic,
    score: input.attempt.score,
    totalMarks: input.attempt.quiz.totalMarks,
    percentage: input.attempt.percentage,
    passed: input.attempt.passed,
    correctCount,
    incorrectCount,
    unansweredCount,
    markedForReviewCount,
    timeTakenSeconds: input.attempt.timeTakenSeconds ?? 0,
    weakTopics,
    strongTopics,
    recommendedRevisionSteps,
    practiceRecommendations,
    xpEarned,
    badgeUnlockSuggestions,
    badgesUnlocked,
    classAverage: input.classAverage ?? input.attempt.percentage,
    percentile: input.percentile ?? Math.min(99, Math.max(1, Math.round(input.attempt.percentage))),
    feedback: {
      overall: buildOverallFeedback(input.attempt.percentage, weakTopics, strongTopics),
      strongTopics: strongTopics.map((topic) => topic.topic),
      weakTopics: weakTopics.map((topic) => topic.topic),
      revisionSteps: recommendedRevisionSteps,
      recommendedPracticeSet: practiceRecommendations[0]
        ? `${practiceRecommendations[0].questionCount} questions on ${practiceRecommendations[0].topic} at ${practiceRecommendations[0].difficulty} difficulty`
        : "A short mixed review set"
    },
    reviewQuestions
  };
}

export function buildPracticeQuestions(topic: string, questions: PracticeSourceQuestion[]) : PracticeQuestion[] {
  const normalizedTopic = topic.trim().toLowerCase();
  const eligibleQuestions = questions.filter((question) => question.options.length > 0);

  const rankedQuestions = eligibleQuestions
    .map((question) => {
      const questionTopic = question.topic.trim().toLowerCase();
      const questionSubject = question.subject.trim().toLowerCase();
      const queryTokens = tokenizePracticeText(normalizedTopic);
      const questionTokens = tokenizePracticeText(`${questionTopic} ${questionSubject}`);
      const tokenOverlap = queryTokens.filter((token) => questionTokens.includes(token)).length;
      const score = PRACTICE_FALLBACK_TOPICS.has(normalizedTopic)
        ? 1
        : questionTopic === normalizedTopic
          ? 100
          : questionSubject === normalizedTopic
            ? 90
            : questionTopic.includes(normalizedTopic) || normalizedTopic.includes(questionTopic)
              ? 75
              : questionSubject.includes(normalizedTopic) || normalizedTopic.includes(questionSubject)
                ? 65
                : tokenOverlap > 0
                  ? 40 + tokenOverlap * 5
                  : 0;
      return { question, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const selectedQuestions = (rankedQuestions.length ? rankedQuestions.map((item) => item.question) : eligibleQuestions).slice(0, 10);

  return selectedQuestions.map((question) => ({
      id: question.id,
      text: question.text,
      explanation: question.explanation ?? "Review the explanation after answering.",
      subject: question.subject,
      topic: question.topic,
      difficulty: question.difficulty,
      options: question.options.map((option) => ({ id: option.id, text: option.text })),
      correctOptionIds: question.options.filter((option) => option.isCorrect).map((option) => option.id),
      source: question.source
    }));
}

export function scorePracticeSubmission(questions: PracticeQuestion[], answers: Array<{ questionId: string; selectedOptionIds?: string[] }>) {
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, new Set(answer.selectedOptionIds ?? [])]));
  let correct = 0;
  const results = questions.map((question) => {
    const selected = byQuestion.get(question.id) ?? new Set<string>();
    const expected = new Set(question.correctOptionIds);
    const isCorrect = selected.size === expected.size && [...expected].every((optionId) => selected.has(optionId));
    if (isCorrect) correct += 1;
    return {
      questionId: question.id,
      isCorrect,
      correctOptionIds: question.correctOptionIds,
      explanation: question.explanation
    };
  });
  const xpEarned = 20 + correct * 12;
  return {
    total: questions.length,
    correct,
    incorrect: Math.max(0, questions.length - correct),
    percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    xpEarned,
    results
  };
}
