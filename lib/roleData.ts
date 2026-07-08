type AttemptSummary = {
  score: number;
  percentage: number;
  topic?: string | null;
  quizTitle: string;
  subject: string;
  status: string;
  createdAt: Date;
};

export function calculateXp(attempts: AttemptSummary[]) {
  return attempts.reduce((total, attempt) => total + Math.round(attempt.score * 100), 0);
}

export function calculateLevel(xp: number) {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

export function mapStudentDashboardData(input: {
  studentName: string;
  activeQuizCount: number;
  enrolledClassCount: number;
  attempts: AttemptSummary[];
}) {
  const completedAttempts = input.attempts.filter((attempt) => attempt.status === "SUBMITTED" || attempt.status === "AUTO_SUBMITTED");
  const xp = calculateXp(completedAttempts);
  const level = calculateLevel(xp);
  const averageAccuracy = completedAttempts.length
    ? Math.round(completedAttempts.reduce((total, attempt) => total + attempt.percentage, 0) / completedAttempts.length)
    : 0;
  const weakTopics = completedAttempts
    .filter((attempt) => attempt.percentage < 70)
    .map((attempt) => attempt.topic || attempt.subject)
    .filter(Boolean);
  const uniqueWeakTopics = [...new Set(weakTopics)];
  const badges = [
    { name: "Quiz Master", unlocked: completedAttempts.length >= 3, progress: Math.min(100, Math.round((completedAttempts.length / 3) * 100)) },
    { name: "Knowledgeable", unlocked: averageAccuracy >= 85, progress: Math.min(100, averageAccuracy) },
    { name: "Collaborator", unlocked: input.enrolledClassCount >= 2, progress: Math.min(100, input.enrolledClassCount * 50) },
    { name: "Champion", unlocked: xp >= 900, progress: Math.min(100, Math.round((xp / 900) * 100)) },
    { name: "Speed Solver", unlocked: completedAttempts.length >= 1, progress: completedAttempts.length ? 100 : 0 },
    { name: "Consistency Star", unlocked: completedAttempts.length >= 2, progress: Math.min(100, completedAttempts.length * 40) }
  ];

  return {
    studentName: input.studentName,
    activeQuizCount: input.activeQuizCount,
    completedQuizCount: completedAttempts.length,
    xp,
    level,
    averageAccuracy,
    weakTopics: uniqueWeakTopics,
    aiSuggestion: uniqueWeakTopics[0]
      ? `Focus next on ${uniqueWeakTopics[0]} with a short revision sprint and one timed practice quiz.`
      : "Keep momentum going with one more practice set to maintain your streak.",
    badges
  };
}

export function mapAdminSummaryData(input: {
  totalUsers: number;
  professorCount: number;
  studentCount: number;
  classCount: number;
  quizCount: number;
  activeQuizCount: number;
}) {
  return [
    { label: "Total Users", value: String(input.totalUsers), hint: "All platform accounts", tone: "purple" },
    { label: "Professors", value: String(input.professorCount), hint: "Teaching accounts", tone: "blue" },
    { label: "Students", value: String(input.studentCount), hint: "Learner accounts", tone: "green" },
    { label: "Classes", value: String(input.classCount), hint: "Managed classrooms", tone: "amber" },
    { label: "Quizzes", value: String(input.quizCount), hint: "Created assessments", tone: "pink" },
    { label: "Active Quizzes", value: String(input.activeQuizCount), hint: "Currently published", tone: "purple" }
  ];
}
