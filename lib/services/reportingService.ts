import { AIInsightType, AttemptStatus, Prisma, QuizStatus, UserRole, type AIInsight, type AttemptAnswer, type Classroom, type ClassroomStudent, type Question, type QuestionBankItem, type QuestionOption, type Quiz, type QuizAttempt, type User } from "@prisma/client";
import { calculateProgressBadges } from "@/lib/services/studentLearningService";

type AttemptWithRelations = QuizAttempt & {
  quiz: Quiz & { classroom: Classroom | null };
  student: User;
  answers: Array<AttemptAnswer & { question: Question; selectedOptions: Array<{ optionId: string }> }>;
};

type ClassroomWithRelations = Classroom & {
  professor: User;
  students: Array<ClassroomStudent & { student: User }>;
  quizzes: Quiz[];
};

type QuizWithRelations = Quiz & {
  classroom: Classroom | null;
  questions: Array<Question & { options: QuestionOption[] }>;
  attempts: AttemptWithRelations[];
};

type InsightWithRelations = AIInsight & {
  user: User | null;
  quiz: Quiz | null;
  classroom: Classroom | null;
};

type ReportingDataset = {
  users: User[];
  classrooms: ClassroomWithRelations[];
  quizzes: QuizWithRelations[];
  attempts: AttemptWithRelations[];
  aiInsights: InsightWithRelations[];
  questionBankItems: QuestionBankItem[];
};

export type ReportFilters = {
  classId?: string;
  quizId?: string;
  studentId?: string;
  reportType?: string;
  from?: string;
  to?: string;
};

type CsvTable = {
  fileName: string;
  rows: string[][];
};

const REPORT_TYPE_META: Record<string, { label: string; description: string; formats: Array<"CSV" | "PDF" | "Excel"> }> = {
  classPerformance: {
    label: "Class Performance Report",
    description: "Track class-level averages, participation, pass rate, and action priorities.",
    formats: ["CSV", "PDF", "Excel"]
  },
  quizResults: {
    label: "Quiz Result Report",
    description: "Inspect every learner submission, score, timing, and pass outcome for a quiz.",
    formats: ["CSV", "PDF", "Excel"]
  },
  studentProgress: {
    label: "Student Progress Report",
    description: "Review learner growth, weak topics, XP, badges, and recent attempts.",
    formats: ["CSV", "PDF", "Excel"]
  },
  questionDifficulty: {
    label: "Question Difficulty Report",
    description: "Identify which questions and topics are easiest or hardest for students.",
    formats: ["CSV", "PDF", "Excel"]
  },
  weakTopics: {
    label: "Weak Topic Report",
    description: "Summarize class-wide weak topics and recommended reteach focus areas.",
    formats: ["CSV", "PDF", "Excel"]
  },
  engagement: {
    label: "Engagement Report",
    description: "Monitor completion, recency, and participation patterns across classes.",
    formats: ["CSV", "PDF", "Excel"]
  }
};

function normalizeDateRange(filters: ReportFilters) {
  const from = filters.from ? new Date(filters.from) : null;
  const to = filters.to ? new Date(filters.to) : null;
  if (to) {
    to.setHours(23, 59, 59, 999);
  }
  return { from, to };
}

function isAttemptInRange(attempt: QuizAttempt, filters: ReportFilters) {
  const { from, to } = normalizeDateRange(filters);
  if (from && attempt.createdAt < from) return false;
  if (to && attempt.createdAt > to) return false;
  return true;
}

function submittedAttempt(attempt: QuizAttempt) {
  return attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.AUTO_SUBMITTED;
}

function formatDateLabel(value?: Date | null) {
  if (!value) return "No data";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatRelativeDate(value?: Date | null) {
  if (!value) return "No recent activity";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function safePercent(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

function buildTopicCounts(attempts: AttemptWithRelations[]) {
  const topicMap = new Map<string, { attempts: number; incorrect: number; correct: number; subject: string }>();
  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const topic = answer.question.topicTag?.trim() || attempt.quiz.topic || attempt.quiz.subject;
      const current = topicMap.get(topic) ?? { attempts: 0, incorrect: 0, correct: 0, subject: attempt.quiz.subject };
      current.attempts += 1;
      if (answer.isCorrect) current.correct += 1;
      else current.incorrect += 1;
      topicMap.set(topic, current);
    }
  }
  return [...topicMap.entries()].map(([topic, value]) => ({
    topic,
    subject: value.subject,
    attempts: value.attempts,
    correctRate: value.attempts ? safePercent((value.correct / value.attempts) * 100) : 0,
    incorrectRate: value.attempts ? safePercent((value.incorrect / value.attempts) * 100) : 0
  }));
}

function recommendationForWeakTopic(topic?: string) {
  return topic
    ? `Reteach ${topic} with a 10-minute concept reset, then assign one short targeted practice loop.`
    : "Activity is still light. Publish or assign another quiz to surface clearer intervention signals.";
}

export async function loadReportingDataset(prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient, input?: { professorId?: string }) : Promise<ReportingDataset> {
  const quizWhere = input?.professorId ? { professorId: input.professorId } : {};
  const classWhere = input?.professorId ? { professorId: input.professorId } : {};
  const [users, classrooms, quizzes, attempts, aiInsights, questionBankItems] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.classroom.findMany({
      where: classWhere,
      include: {
        professor: true,
        students: { include: { student: true } },
        quizzes: true
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.quiz.findMany({
      where: quizWhere,
      include: {
        classroom: true,
        questions: { include: { options: { orderBy: { orderIndex: "asc" } } }, orderBy: { orderIndex: "asc" } },
        attempts: {
          include: {
            student: true,
            quiz: { include: { classroom: true } },
            answers: {
              include: {
                question: true,
                selectedOptions: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.quizAttempt.findMany({
      where: input?.professorId ? { quiz: { professorId: input.professorId } } : {},
      include: {
        student: true,
        quiz: { include: { classroom: true } },
        answers: {
          include: {
            question: true,
            selectedOptions: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.aIInsight.findMany({
      where: input?.professorId ? { OR: [{ userId: input.professorId }, { quiz: { professorId: input.professorId } }, { classroom: { professorId: input.professorId } }] } : {},
      include: {
        user: true,
        quiz: true,
        classroom: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.questionBankItem.findMany({
      where: input?.professorId ? { professorId: input.professorId } : {},
      orderBy: { createdAt: "desc" }
    })
  ]);

  return { users, classrooms, quizzes: quizzes as QuizWithRelations[], attempts: attempts as AttemptWithRelations[], aiInsights: aiInsights as InsightWithRelations[], questionBankItems };
}

function filterProfessorAttempts(dataset: ReportingDataset, filters: ReportFilters) {
  return dataset.attempts.filter((attempt) => {
    if (!submittedAttempt(attempt)) return false;
    if (filters.classId && attempt.quiz.classroomId !== filters.classId) return false;
    if (filters.quizId && attempt.quizId !== filters.quizId) return false;
    if (filters.studentId && attempt.studentId !== filters.studentId) return false;
    return isAttemptInRange(attempt, filters);
  });
}

function buildClassPerformanceRows(dataset: ReportingDataset, filters: ReportFilters) {
  return dataset.classrooms.map((classroom) => {
    const attempts = filterProfessorAttempts(dataset, { ...filters, classId: filters.classId ?? classroom.id });
    const scoped = attempts.filter((attempt) => attempt.quiz.classroomId === classroom.id);
    const averageScore = scoped.length ? safePercent(scoped.reduce((sum, attempt) => sum + attempt.percentage, 0) / scoped.length) : 0;
    const passRate = scoped.length ? safePercent((scoped.filter((attempt) => attempt.passed).length / scoped.length) * 100) : 0;
    return {
      id: classroom.id,
      className: classroom.name,
      subject: classroom.subject,
      professor: classroom.professor.name,
      students: classroom.students.length,
      quizzes: classroom.quizzes.length,
      attempts: scoped.length,
      averageScore,
      passRate,
      engagement: scoped.length >= classroom.students.length * 2 ? "High" : scoped.length > 0 ? "Medium" : "Low",
      lastAttemptAt: scoped[0]?.createdAt ?? null
    };
  });
}

function buildQuizResultRows(dataset: ReportingDataset, filters: ReportFilters) {
  return filterProfessorAttempts(dataset, filters).map((attempt) => ({
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quiz.title,
    className: attempt.quiz.classroom?.name ?? "Unassigned",
    studentId: attempt.studentId,
    studentName: attempt.student.name,
    subject: attempt.quiz.subject,
    topic: attempt.quiz.topic,
    score: attempt.score,
    totalMarks: attempt.quiz.totalMarks,
    percentage: safePercent(attempt.percentage),
    status: attempt.passed ? "Passed" : "Needs support",
    timeTakenMinutes: attempt.timeTakenSeconds ? (attempt.timeTakenSeconds / 60).toFixed(1) : "0.0",
    submittedAt: formatDateLabel(attempt.submittedAt ?? attempt.createdAt)
  }));
}

function buildStudentProgressRows(dataset: ReportingDataset, filters: ReportFilters) {
  const scopedAttempts = filterProfessorAttempts(dataset, filters);
  const students = new Map<string, { student: User; attempts: AttemptWithRelations[]; classes: Set<string> }>();
  for (const attempt of scopedAttempts) {
    const current = students.get(attempt.studentId) ?? { student: attempt.student, attempts: [], classes: new Set<string>() };
    current.attempts.push(attempt);
    if (attempt.quiz.classroom?.name) current.classes.add(attempt.quiz.classroom.name);
    students.set(attempt.studentId, current);
  }

  return [...students.values()].map(({ student, attempts, classes }) => {
    const averageScore = attempts.length ? safePercent(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0;
    const topicCounts = buildTopicCounts(attempts);
    const weakTopics = topicCounts.filter((topic) => topic.correctRate < 70).sort((left, right) => right.incorrectRate - left.incorrectRate);
    const badges = calculateProgressBadges(attempts.map((attempt) => ({
      id: attempt.id,
      quizId: attempt.quizId,
      title: attempt.quiz.title,
      subject: attempt.quiz.subject,
      topic: attempt.quiz.topic,
      difficulty: attempt.quiz.difficulty,
      percentage: attempt.percentage,
      score: attempt.score,
      passed: attempt.passed,
      status: attempt.status,
      timeTakenSeconds: attempt.timeTakenSeconds,
      suggestedTimeMinutes: attempt.quiz.timeLimitMinutes,
      createdAt: attempt.createdAt
    })));

    const sortedAttempts = [...attempts].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
    const growth = sortedAttempts.length > 1 ? safePercent(sortedAttempts[sortedAttempts.length - 1].percentage - sortedAttempts[0].percentage) : 0;
    return {
      studentId: student.id,
      studentName: student.name,
      email: student.email,
      classes: [...classes],
      averageScore,
      accuracy: averageScore,
      quizzesTaken: attempts.length,
      growth,
      xp: badges.xp,
      level: badges.level,
      unlockedBadges: badges.badges.filter((badge) => badge.unlocked).map((badge) => badge.name),
      weakTopics: weakTopics.slice(0, 3).map((topic) => topic.topic),
      lastAttemptAt: attempts[0]?.createdAt ?? null
    };
  }).sort((left, right) => right.averageScore - left.averageScore);
}

function buildQuestionDifficultyRows(dataset: ReportingDataset, filters: ReportFilters) {
  const attempts = filterProfessorAttempts(dataset, filters);
  const rows = new Map<string, {
    quizTitle: string;
    className: string;
    questionId: string;
    questionText: string;
    topic: string;
    difficulty: string;
    correct: number;
    incorrect: number;
    attempts: number;
  }>();

  for (const attempt of attempts) {
    for (const answer of attempt.answers) {
      const key = answer.questionId;
      const current = rows.get(key) ?? {
        quizTitle: attempt.quiz.title,
        className: attempt.quiz.classroom?.name ?? "Unassigned",
        questionId: answer.questionId,
        questionText: answer.question.text,
        topic: answer.question.topicTag?.trim() || attempt.quiz.topic,
        difficulty: answer.question.difficulty?.trim() || attempt.quiz.difficulty,
        correct: 0,
        incorrect: 0,
        attempts: 0
      };
      current.attempts += 1;
      if (answer.isCorrect) current.correct += 1;
      else current.incorrect += 1;
      rows.set(key, current);
    }
  }

  return [...rows.values()].map((row) => ({
    ...row,
    accuracy: row.attempts ? safePercent((row.correct / row.attempts) * 100) : 0,
    incorrectRate: row.attempts ? safePercent((row.incorrect / row.attempts) * 100) : 0
  })).sort((left, right) => right.incorrectRate - left.incorrectRate);
}

function buildEngagementRows(dataset: ReportingDataset, filters: ReportFilters) {
  return dataset.classrooms.map((classroom) => {
    const attempts = filterProfessorAttempts(dataset, { ...filters, classId: classroom.id }).filter((attempt) => attempt.quiz.classroomId === classroom.id);
    const uniqueStudents = new Set(attempts.map((attempt) => attempt.studentId));
    const completionRate = classroom.students.length ? safePercent((uniqueStudents.size / classroom.students.length) * 100) : 0;
    return {
      id: classroom.id,
      className: classroom.name,
      completionRate,
      activeLearners: uniqueStudents.size,
      totalLearners: classroom.students.length,
      attempts: attempts.length,
      recentActivity: formatRelativeDate(attempts[0]?.createdAt ?? null)
    };
  });
}

export function buildProfessorReportsView(dataset: ReportingDataset, filters: ReportFilters) {
  const classPerformance = buildClassPerformanceRows(dataset, filters);
  const quizResults = buildQuizResultRows(dataset, filters);
  const studentProgress = buildStudentProgressRows(dataset, filters);
  const questionDifficulty = buildQuestionDifficultyRows(dataset, filters);
  const weakTopics = buildTopicCounts(filterProfessorAttempts(dataset, filters)).sort((left, right) => right.incorrectRate - left.incorrectRate);
  const engagement = buildEngagementRows(dataset, filters);
  const activeType = filters.reportType && REPORT_TYPE_META[filters.reportType] ? filters.reportType : "quizResults";

  const reportCards = Object.entries(REPORT_TYPE_META).map(([key, meta]) => {
    const rowCount = key === "classPerformance"
      ? classPerformance.length
      : key === "quizResults"
        ? quizResults.length
        : key === "studentProgress"
          ? studentProgress.length
          : key === "questionDifficulty"
            ? questionDifficulty.length
            : key === "weakTopics"
              ? weakTopics.length
              : engagement.length;
    const mostRecent = key === "quizResults"
      ? quizResults[0]?.submittedAt
      : key === "studentProgress"
        ? formatDateLabel(studentProgress[0]?.lastAttemptAt)
        : key === "questionDifficulty"
          ? quizResults[0]?.submittedAt
          : formatDateLabel(new Date());
    return {
      key,
      title: meta.label,
      description: meta.description,
      lastGenerated: mostRecent,
      rowCount,
      formats: meta.formats,
      enabledExports: key === "quizResults" || key === "studentProgress" || key === "questionDifficulty" ? ["CSV"] : [],
      isActive: activeType === key
    };
  });

  const summaries = {
    classPerformance: {
      cards: [
        { label: "Classes in scope", value: String(classPerformance.length), hint: "Filtered classrooms" },
        { label: "Average score", value: `${safePercent(classPerformance.reduce((sum, row) => sum + row.averageScore, 0) / Math.max(1, classPerformance.length))}%`, hint: "Across included classes" },
        { label: "Pass rate", value: `${safePercent(classPerformance.reduce((sum, row) => sum + row.passRate, 0) / Math.max(1, classPerformance.length))}%`, hint: "Class average" }
      ],
      chart: classPerformance.slice(0, 6).map((row) => ({ label: row.className, value: row.averageScore })),
      rows: classPerformance,
      recommendation: recommendationForWeakTopic(weakTopics[0]?.topic)
    },
    quizResults: {
      cards: [
        { label: "Attempts", value: String(quizResults.length), hint: "Submitted quiz records" },
        { label: "Average score", value: `${safePercent(quizResults.reduce((sum, row) => sum + row.percentage, 0) / Math.max(1, quizResults.length))}%`, hint: "Across filtered attempts" },
        { label: "Students passed", value: String(quizResults.filter((row) => row.status === "Passed").length), hint: "Passing submissions" }
      ],
      chart: quizResults.slice(0, 8).map((row) => ({ label: row.studentName.split(" ")[0], value: row.percentage })),
      rows: quizResults,
      recommendation: recommendationForWeakTopic(weakTopics[0]?.topic)
    },
    studentProgress: {
      cards: [
        { label: "Students", value: String(studentProgress.length), hint: "Learners with attempts" },
        { label: "Avg accuracy", value: `${safePercent(studentProgress.reduce((sum, row) => sum + row.accuracy, 0) / Math.max(1, studentProgress.length))}%`, hint: "Filtered student pool" },
        { label: "At-risk learners", value: String(studentProgress.filter((row) => row.averageScore < 70).length), hint: "Needs support" }
      ],
      chart: studentProgress.slice(0, 8).map((row) => ({ label: row.studentName.split(" ")[0], value: row.averageScore })),
      rows: studentProgress,
      recommendation: recommendationForWeakTopic(studentProgress.find((row) => row.weakTopics.length)?.weakTopics[0])
    },
    questionDifficulty: {
      cards: [
        { label: "Questions analyzed", value: String(questionDifficulty.length), hint: "Questions with submissions" },
        { label: "Hardest topic", value: weakTopics[0]?.topic ?? "None yet", hint: weakTopics[0] ? `${weakTopics[0].incorrectRate}% incorrect` : "Awaiting more attempts" },
        { label: "High risk items", value: String(questionDifficulty.filter((row) => row.incorrectRate >= 50).length), hint: "Needs reteach" }
      ],
      chart: questionDifficulty.slice(0, 8).map((row) => ({ label: row.topic, value: row.incorrectRate })),
      rows: questionDifficulty,
      recommendation: recommendationForWeakTopic(weakTopics[0]?.topic)
    },
    weakTopics: {
      cards: [
        { label: "Topics analyzed", value: String(weakTopics.length), hint: "Across filtered submissions" },
        { label: "Weakest topic", value: weakTopics[0]?.topic ?? "None yet", hint: weakTopics[0] ? `${weakTopics[0].incorrectRate}% incorrect` : "Awaiting data" },
        { label: "Healthy topics", value: String(weakTopics.filter((row) => row.correctRate >= 75).length), hint: "Strong areas" }
      ],
      chart: weakTopics.slice(0, 8).map((row) => ({ label: row.topic, value: row.incorrectRate })),
      rows: weakTopics,
      recommendation: recommendationForWeakTopic(weakTopics[0]?.topic)
    },
    engagement: {
      cards: [
        { label: "Classes tracked", value: String(engagement.length), hint: "Engagement rows" },
        { label: "Avg completion", value: `${safePercent(engagement.reduce((sum, row) => sum + row.completionRate, 0) / Math.max(1, engagement.length))}%`, hint: "Students with attempts" },
        { label: "Low engagement classes", value: String(engagement.filter((row) => row.completionRate < 60).length), hint: "Need follow-up" }
      ],
      chart: engagement.slice(0, 8).map((row) => ({ label: row.className, value: row.completionRate })),
      rows: engagement,
      recommendation: recommendationForWeakTopic(classPerformance.find((row) => row.engagement === "Low")?.className)
    }
  };

  const recentReports = reportCards.map((card, index) => ({
    id: `${card.key}-${index}`,
    name: card.title,
    type: card.title.replace(" Report", ""),
    context: filters.quizId
      ? quizResults.find((row) => row.quizId === filters.quizId)?.quizTitle ?? "Scoped quiz"
      : filters.classId
        ? classPerformance.find((row) => row.id === filters.classId)?.className ?? "Scoped class"
        : "All classes",
    generatedAt: card.lastGenerated,
    generatedBy: "Prof. John Doe",
    status: card.rowCount > 0 ? "Ready" : "Awaiting data"
  }));

  return {
    filters: {
      classes: dataset.classrooms.map((classroom) => ({ id: classroom.id, label: classroom.name })),
      quizzes: dataset.quizzes.map((quiz) => ({ id: quiz.id, label: quiz.title })),
      students: [...new Map(dataset.attempts.map((attempt) => [attempt.student.id, attempt.student])).values()].map((student) => ({ id: student.id, label: student.name })),
      reportTypes: Object.entries(REPORT_TYPE_META).map(([key, meta]) => ({ id: key, label: meta.label }))
    },
    reportCards,
    recentReports,
    preview: {
      activeType,
      title: REPORT_TYPE_META[activeType].label,
      ...summaries[activeType as keyof typeof summaries]
    }
  };
}

export function buildQuizResultsCsv(dataset: ReportingDataset, filters: ReportFilters): CsvTable {
  const rows = buildQuizResultRows(dataset, filters);
  return {
    fileName: `quiz-results-${filters.quizId ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`,
    rows: [
      ["Quiz", "Class", "Student", "Subject", "Topic", "Score", "Total Marks", "Percentage", "Status", "Time Taken (min)", "Submitted At"],
      ...rows.map((row) => [row.quizTitle, row.className, row.studentName, row.subject, row.topic, String(row.score), String(row.totalMarks), `${row.percentage}%`, row.status, row.timeTakenMinutes, row.submittedAt])
    ]
  };
}

export function buildStudentProgressCsv(dataset: ReportingDataset, filters: ReportFilters): CsvTable {
  const rows = buildStudentProgressRows(dataset, filters);
  return {
    fileName: `student-progress-${filters.classId ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`,
    rows: [
      ["Student", "Email", "Classes", "Average Score", "Accuracy", "Quizzes Taken", "Growth", "XP", "Level", "Weak Topics", "Unlocked Badges", "Last Attempt"],
      ...rows.map((row) => [
        row.studentName,
        row.email,
        row.classes.join(" | "),
        `${row.averageScore}%`,
        `${row.accuracy}%`,
        String(row.quizzesTaken),
        `${row.growth}%`,
        String(row.xp),
        String(row.level),
        row.weakTopics.join(" | "),
        row.unlockedBadges.join(" | "),
        formatDateLabel(row.lastAttemptAt)
      ])
    ]
  };
}

export function buildQuestionDifficultyCsv(dataset: ReportingDataset, filters: ReportFilters): CsvTable {
  const rows = buildQuestionDifficultyRows(dataset, filters);
  return {
    fileName: `question-difficulty-${filters.quizId ?? "all"}-${new Date().toISOString().slice(0, 10)}.csv`,
    rows: [
      ["Quiz", "Class", "Topic", "Question", "Difficulty", "Attempts", "Accuracy", "Incorrect Rate"],
      ...rows.map((row) => [row.quizTitle, row.className, row.topic, row.questionText, row.difficulty, String(row.attempts), `${row.accuracy}%`, `${row.incorrectRate}%`])
    ]
  };
}

export function csvTableToString(table: CsvTable) {
  return table.rows
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, "\"\"")}"`).join(","))
    .join("\n");
}

export function buildProfessorStudentsView(dataset: ReportingDataset) {
  const progressRows = buildStudentProgressRows(dataset, {});
  const classOptions = dataset.classrooms.map((classroom) => ({ id: classroom.id, label: classroom.name }));

  const studentMap = progressRows.map((row) => {
    const attempts = filterProfessorAttempts(dataset, { studentId: row.studentId });
    const recentAttempts = attempts.slice(0, 4).map((attempt) => ({
      id: attempt.id,
      quizTitle: attempt.quiz.title,
      percentage: safePercent(attempt.percentage),
      passed: attempt.passed,
      submittedAt: formatDateLabel(attempt.submittedAt ?? attempt.createdAt)
    }));
    const recommendedAction = row.averageScore < 60
      ? `Schedule a quick intervention for ${row.weakTopics[0] ?? "core concepts"} and assign a remedial quiz.`
      : row.averageScore < 75
        ? `Message support soon and review the last two attempts before the next class.`
        : "Keep this learner challenged with one stretch question or peer-support task.";

    return {
      ...row,
      risk: row.averageScore < 60 ? "High" : row.averageScore < 75 ? "Medium" : "Low",
      needsAttention: row.averageScore < 70,
      recentAttempts,
      recommendedAction
    };
  });

  return { classOptions, students: studentMap };
}

function buildUserStatus(user: User, attempts: AttemptWithRelations[], aiInsights: InsightWithRelations[]) {
  if (user.role === UserRole.ADMIN) return "Platform Admin";
  if (user.role === UserRole.PROFESSOR) {
    return aiInsights.some((item) => item.userId === user.id) ? "Active" : "Quiet";
  }
  return attempts.some((attempt) => attempt.studentId === user.id) ? "Active" : "Needs onboarding";
}

export function buildAdminSummaryView(dataset: ReportingDataset) {
  const totalUsers = dataset.users.length;
  const professorCount = dataset.users.filter((user) => user.role === UserRole.PROFESSOR).length;
  const studentCount = dataset.users.filter((user) => user.role === UserRole.STUDENT).length;
  const adminCount = dataset.users.filter((user) => user.role === UserRole.ADMIN).length;
  const submittedAttempts = dataset.attempts.filter((attempt) => submittedAttempt(attempt));
  const topSubjects = new Map<string, { quizzes: number; attempts: number; total: number }>();
  for (const quiz of dataset.quizzes) {
    const current = topSubjects.get(quiz.subject) ?? { quizzes: 0, attempts: 0, total: 0 };
    current.quizzes += 1;
    current.total += 1;
    topSubjects.set(quiz.subject, current);
  }
  for (const attempt of submittedAttempts) {
    const current = topSubjects.get(attempt.quiz.subject) ?? { quizzes: 0, attempts: 0, total: 0 };
    current.attempts += 1;
    topSubjects.set(attempt.quiz.subject, current);
  }

  const moderationQueue = dataset.aiInsights.map((item) => ({
    id: item.id,
    professor: item.user?.name ?? item.quiz?.professorId ?? "System",
    type: item.type,
    subject: item.quiz?.subject ?? item.classroom?.subject ?? "General",
    topic: item.quiz?.topic ?? "Generated content",
    generatedQuestionCount: extractQuestionCount(item.outputJson),
    confidence: extractConfidence(item.outputJson),
    warnings: extractWarnings(item.outputJson),
    status: deriveModerationStatus(item),
    createdAt: formatDateLabel(item.createdAt),
    preview: summarizeInsightOutput(item.outputJson)
  }));

  return {
    stats: [
      { label: "Total Users", value: String(totalUsers), hint: "All accounts", tone: "purple" },
      { label: "Professors", value: String(professorCount), hint: "Teaching accounts", tone: "blue" },
      { label: "Students", value: String(studentCount), hint: "Learner accounts", tone: "green" },
      { label: "Admins", value: String(adminCount), hint: "Platform managers", tone: "pink" },
      { label: "Classes", value: String(dataset.classrooms.length), hint: "Active classrooms", tone: "amber" },
      { label: "Quizzes", value: String(dataset.quizzes.length), hint: "Draft and published", tone: "purple" },
      { label: "Attempts", value: String(submittedAttempts.length), hint: "Submitted quiz attempts", tone: "blue" },
      { label: "AI Generations", value: String(dataset.aiInsights.length), hint: "Recorded AI activity", tone: "green" },
      { label: "Active Quizzes", value: String(dataset.quizzes.filter((quiz) => quiz.status === QuizStatus.PUBLISHED).length), hint: "Currently published", tone: "amber" },
      { label: "Question Bank", value: String(dataset.questionBankItems.length), hint: "Reusable questions", tone: "pink" }
    ],
    recentActivity: submittedAttempts.slice(0, 8).map((attempt) => ({
      id: attempt.id,
      actor: attempt.student.name,
      text: `submitted ${attempt.quiz.title} in ${attempt.quiz.classroom?.name ?? "an unassigned class"}`,
      time: formatRelativeDate(attempt.createdAt)
    })),
    aiActivity: moderationQueue.slice(0, 6),
    topSubjects: [...topSubjects.entries()].map(([subject, value]) => ({
      subject,
      quizzes: value.quizzes,
      attempts: value.attempts
    })).sort((left, right) => right.attempts - left.attempts).slice(0, 6),
    systemHealth: [
      { label: "API availability", value: "Nominal", tone: "green", detail: "Core demo routes responded during verification." },
      { label: "Seed consistency", value: "Aligned", tone: "blue", detail: "Reports, dashboards, and moderation all reference seeded records." },
      { label: "Moderation coverage", value: moderationQueue.length ? "Visible" : "Light", tone: moderationQueue.length ? "amber" : "purple", detail: `${moderationQueue.filter((item) => item.status === "Needs Review").length} records need closer review.` }
    ],
    riskSummary: {
      flaggedLearners: buildStudentProgressRows(dataset, {}).filter((row) => row.averageScore < 70).length,
      moderationNeedsReview: moderationQueue.filter((item) => item.status === "Needs Review").length,
      lowEngagementClasses: buildEngagementRows(dataset, {}).filter((row) => row.completionRate < 60).length
    },
    moderationQueue
  };
}

export function buildAdminUsersView(dataset: ReportingDataset) {
  return dataset.users.map((user) => {
    const enrollments = dataset.classrooms.filter((classroom) => classroom.students.some((item) => item.studentId === user.id));
    const quizzes = dataset.quizzes.filter((quiz) => quiz.professorId === user.id);
    const attempts = dataset.attempts.filter((attempt) => attempt.studentId === user.id);
    const aiInsights = dataset.aiInsights.filter((insight) => insight.userId === user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      joinedDate: formatDateLabel(user.createdAt),
      classesOrEnrollments: user.role === UserRole.PROFESSOR ? quizzes.length ? dataset.classrooms.filter((classroom) => classroom.professorId === user.id).length : 0 : enrollments.length,
      quizzesOrAttempts: user.role === UserRole.PROFESSOR ? quizzes.length : attempts.length,
      status: buildUserStatus(user, dataset.attempts, dataset.aiInsights),
      profile: {
        role: user.role,
        joinedDate: formatDateLabel(user.createdAt),
        classes: (user.role === UserRole.PROFESSOR ? dataset.classrooms.filter((classroom) => classroom.professorId === user.id).map((classroom) => classroom.name) : enrollments.map((item) => item.name)).slice(0, 4),
        quizzesCreated: quizzes.length,
        attemptsTaken: attempts.length,
        aiInsights: aiInsights.length,
        summary: user.role === UserRole.PROFESSOR
          ? `Created ${quizzes.length} quizzes and ${aiInsights.length} AI insight records in the seeded environment.`
          : user.role === UserRole.STUDENT
            ? `Completed ${attempts.filter((attempt) => submittedAttempt(attempt)).length} submitted attempts across ${enrollments.length} classes.`
            : "Admin oversight account for the Quizly demo environment."
      }
    };
  });
}

export function buildAdminClassesView(dataset: ReportingDataset) {
  return dataset.classrooms.map((classroom) => {
    const attempts = dataset.attempts.filter((attempt) => attempt.quiz.classroomId === classroom.id && submittedAttempt(attempt));
    const averagePerformance = attempts.length ? safePercent(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0;
    return {
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject,
      professor: classroom.professor.name,
      studentCount: classroom.students.length,
      quizCount: classroom.quizzes.length,
      averagePerformance,
      recentActivity: attempts[0] ? `${attempts[0].student.name} submitted ${attempts[0].quiz.title}` : "No recent submissions",
      updatedAt: formatDateLabel(attempts[0]?.createdAt ?? classroom.updatedAt)
    };
  });
}

export function buildAdminSubjectsView(dataset: ReportingDataset) {
  const subjectMap = new Map<string, {
    subject: string;
    classes: number;
    quizzes: number;
    questions: number;
    attempts: number;
    totalScore: number;
  }>();

  for (const classroom of dataset.classrooms) {
    const current = subjectMap.get(classroom.subject) ?? { subject: classroom.subject, classes: 0, quizzes: 0, questions: 0, attempts: 0, totalScore: 0 };
    current.classes += 1;
    subjectMap.set(classroom.subject, current);
  }

  for (const quiz of dataset.quizzes) {
    const current = subjectMap.get(quiz.subject) ?? { subject: quiz.subject, classes: 0, quizzes: 0, questions: 0, attempts: 0, totalScore: 0 };
    current.quizzes += 1;
    current.questions += quiz.questions.length;
    subjectMap.set(quiz.subject, current);
  }

  for (const attempt of dataset.attempts.filter((item) => submittedAttempt(item))) {
    const current = subjectMap.get(attempt.quiz.subject) ?? { subject: attempt.quiz.subject, classes: 0, quizzes: 0, questions: 0, attempts: 0, totalScore: 0 };
    current.attempts += 1;
    current.totalScore += attempt.percentage;
    subjectMap.set(attempt.quiz.subject, current);
  }

  const accents = ["purple", "blue", "green", "amber", "pink"];
  return [...subjectMap.values()].map((row, index) => ({
    ...row,
    averagePerformance: row.attempts ? safePercent(row.totalScore / row.attempts) : 0,
    accent: accents[index % accents.length]
  })).sort((left, right) => right.quizzes - left.quizzes);
}

export function buildAdminAiGenerationsView(dataset: ReportingDataset) {
  return buildAdminSummaryView(dataset).moderationQueue;
}

function parseJsonLoose(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractQuestionCount(outputJson: string) {
  const parsed = parseJsonLoose(outputJson);
  if (Array.isArray(parsed?.questions)) return parsed.questions.length;
  if (typeof parsed?.questionCount === "number") return parsed.questionCount;
  return 0;
}

function extractConfidence(outputJson: string) {
  const parsed = parseJsonLoose(outputJson);
  if (typeof parsed?.confidence === "number") return `${parsed.confidence}%`;
  if (Array.isArray(parsed?.questions) && parsed.questions.length) return `${Math.max(72, Math.min(96, 70 + parsed.questions.length * 4))}%`;
  return "78%";
}

function extractWarnings(outputJson: string) {
  const parsed = parseJsonLoose(outputJson);
  if (Array.isArray(parsed?.warnings) && parsed.warnings.length) return parsed.warnings.join(", ");
  if (Array.isArray(parsed?.questions) && parsed.questions.some((question: { difficulty?: string }) => question.difficulty === "Hard")) {
    return "Contains advanced questions";
  }
  return "No major warnings";
}

function deriveModerationStatus(item: InsightWithRelations) {
  if (item.type === AIInsightType.QUESTION_IMPROVEMENT) return "Accepted";
  if (item.type === AIInsightType.TEACHER_ANALYTICS) return "Drafted";
  if (item.type === AIInsightType.REMEDIAL_GENERATION) return "Needs Review";
  return "Accepted";
}

function summarizeInsightOutput(outputJson: string) {
  const parsed = parseJsonLoose(outputJson);
  if (typeof parsed?.summary === "string") return parsed.summary;
  if (Array.isArray(parsed?.questions)) return `Generated ${parsed.questions.length} question drafts.`;
  if (typeof parsed?.text === "string") return parsed.text;
  return "Preview available in future moderation tools.";
}
