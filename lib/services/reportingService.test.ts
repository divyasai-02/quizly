import { AIInsightModerationStatus, AttemptStatus, AIInsightType, QuizStatus, UserRole, type AIInsight, type AttemptAnswer, type Classroom, type ClassroomStudent, type Question, type QuestionBankItem, type Quiz, type QuizAttempt, type User } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildAdminAiGenerationsView,
  buildAdminSubjectsView,
  buildAdminSummaryView,
  buildReportCsv,
  buildProfessorReportsView,
  buildProfessorStudentsView,
  buildQuestionDifficultyCsv,
  buildQuizResultsCsv,
  buildStudentProgressCsv,
  csvTableToExcelHtml,
  csvTableToPdfBuffer,
  csvTableToString
} from "./reportingService";

function date(value: string) {
  return new Date(value);
}

const professor: User = {
  id: "prof-1",
  name: "Prof. John Doe",
  email: "john@example.com",
  passwordHash: "x",
  role: UserRole.PROFESSOR,
  avatarUrl: null,
  disabledAt: null,
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const student: User = {
  id: "student-1",
  name: "Arjun Mehta",
  email: "arjun@example.com",
  passwordHash: "x",
  role: UserRole.STUDENT,
  avatarUrl: null,
  disabledAt: null,
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const admin: User = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  passwordHash: "x",
  role: UserRole.ADMIN,
  avatarUrl: null,
  disabledAt: null,
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const classroom: Classroom = {
  id: "class-1",
  name: "CSE - A",
  subject: "Database Systems",
  section: "A",
  professorId: professor.id,
  joinCode: "JOIN1",
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const enrollment: ClassroomStudent = {
  id: "enrollment-1",
  classroomId: classroom.id,
  studentId: student.id,
  joinedAt: date("2026-07-01T00:00:00.000Z")
};

const quiz: Quiz = {
  id: "quiz-1",
  title: "DBMS Fundamentals",
  description: "Quiz",
  subject: "Database Systems",
  topic: "DBMS",
  difficulty: "Medium",
  status: QuizStatus.PUBLISHED,
  professorId: professor.id,
  classroomId: classroom.id,
  timeLimitMinutes: 20,
  totalMarks: 2,
  passingMarks: 1,
  aiGenerated: false,
  aiPrompt: null,
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z"),
  publishedAt: date("2026-07-02T00:00:00.000Z")
};

const questionOne: Question = {
  id: "question-1",
  quizId: quiz.id,
  type: "MCQ_SINGLE",
  text: "SQL stands for?",
  explanation: "Structured Query Language.",
  marks: 1,
  negativeMarks: 0,
  timeLimitSeconds: 60,
  required: true,
  shuffleOptions: false,
  orderIndex: 0,
  aiGenerated: false,
  sourceLabel: null,
  difficulty: "Easy",
  topicTag: "SQL Basics",
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const questionTwo: Question = {
  ...questionOne,
  id: "question-2",
  text: "2NF removes partial dependency.",
  topicTag: "Normalization"
};

const attemptBase: QuizAttempt = {
  id: "attempt-1",
  quizId: quiz.id,
  studentId: student.id,
  status: AttemptStatus.SUBMITTED,
  startedAt: date("2026-07-03T10:00:00.000Z"),
  submittedAt: date("2026-07-03T10:10:00.000Z"),
  timeTakenSeconds: 600,
  score: 1,
  percentage: 50,
  passed: true,
  createdAt: date("2026-07-03T10:10:00.000Z"),
  updatedAt: date("2026-07-03T10:10:00.000Z")
};

const aiInsight: AIInsight = {
  id: "ai-1",
  quizId: quiz.id,
  attemptId: null,
  classroomId: classroom.id,
  userId: professor.id,
  type: AIInsightType.REMEDIAL_GENERATION,
  inputJson: JSON.stringify({ topic: "SQL Basics" }),
  outputJson: JSON.stringify({ questions: [{ id: 1 }, { id: 2 }], summary: "Needs review", warnings: ["Contains advanced questions"] }),
  moderationStatus: AIInsightModerationStatus.PENDING,
  moderationNote: null,
  moderatedAt: null,
  moderatedById: null,
  hiddenAt: null,
  createdAt: date("2026-07-04T00:00:00.000Z")
};

const questionBankItem: QuestionBankItem = {
  id: "bank-1",
  professorId: professor.id,
  subject: "Database Systems",
  topic: "SQL",
  difficulty: "Medium",
  type: "MCQ_SINGLE",
  text: "HAVING filters grouped records.",
  explanation: "HAVING works after GROUP BY.",
  marks: 1,
  optionsJson: "[]",
  aiGenerated: true,
  createdAt: date("2026-07-01T00:00:00.000Z"),
  updatedAt: date("2026-07-01T00:00:00.000Z")
};

const dataset = {
  users: [professor, student, admin],
  classrooms: [
    {
      ...classroom,
      professor,
      students: [{ ...enrollment, student }],
      quizzes: [quiz]
    }
  ],
  quizzes: [
    {
      ...quiz,
      classroom,
      questions: [
        { ...questionOne, options: [] },
        { ...questionTwo, options: [] }
      ],
      attempts: [
        {
          ...attemptBase,
          quiz: { ...quiz, classroom },
          student,
          answers: [
            { id: "answer-1", attemptId: attemptBase.id, questionId: questionOne.id, textAnswer: null, isCorrect: false, marksAwarded: 0, markedForReview: false, answeredAt: date("2026-07-03T10:02:00.000Z"), question: questionOne, selectedOptions: [{ optionId: "opt-1" }] },
            { id: "answer-2", attemptId: attemptBase.id, questionId: questionTwo.id, textAnswer: null, isCorrect: true, marksAwarded: 1, markedForReview: false, answeredAt: date("2026-07-03T10:05:00.000Z"), question: questionTwo, selectedOptions: [{ optionId: "opt-2" }] }
          ]
        }
      ]
    }
  ],
  attempts: [
    {
      ...attemptBase,
      quiz: { ...quiz, classroom },
      student,
      answers: [
        { id: "answer-1", attemptId: attemptBase.id, questionId: questionOne.id, textAnswer: null, isCorrect: false, marksAwarded: 0, markedForReview: false, answeredAt: date("2026-07-03T10:02:00.000Z"), question: questionOne, selectedOptions: [{ optionId: "opt-1" }] },
        { id: "answer-2", attemptId: attemptBase.id, questionId: questionTwo.id, textAnswer: null, isCorrect: true, marksAwarded: 1, markedForReview: false, answeredAt: date("2026-07-03T10:05:00.000Z"), question: questionTwo, selectedOptions: [{ optionId: "opt-2" }] }
      ]
    }
  ],
  aiInsights: [
    {
      ...aiInsight,
      user: professor,
      quiz,
      classroom
    }
  ],
  questionBankItems: [questionBankItem]
};

describe("reportingService", () => {
  it("builds professor report previews", () => {
    const view = buildProfessorReportsView(dataset as any, { reportType: "questionDifficulty" });
    expect(view.reportCards).toHaveLength(6);
    expect(view.preview.title).toBe("Question Difficulty Report");
    expect((view.preview.rows[0] as any).topic).toBe("SQL Basics");
  });

  it("generates CSV tables with headers", () => {
    const csv = csvTableToString(buildQuizResultsCsv(dataset as any, {}));
    expect(csv).toContain("\"Quiz\"");
    expect(csv).toContain("DBMS Fundamentals");

    const studentCsv = buildStudentProgressCsv(dataset as any, {});
    expect(studentCsv.rows[0]).toContain("Student");

    const difficultyCsv = buildQuestionDifficultyCsv(dataset as any, {});
    expect(difficultyCsv.rows[0]).toContain("Question");
  });

  it("exports every professor report type in CSV, Excel, and PDF forms", () => {
    for (const reportType of ["classPerformance", "quizResults", "studentProgress", "questionDifficulty", "weakTopics", "engagement"]) {
      const table = buildReportCsv(dataset as any, { reportType });
      expect(table.rows[0].length).toBeGreaterThan(1);
      expect(csvTableToString(table)).toContain("\"");
      expect(csvTableToExcelHtml(table)).toContain("<table>");
      expect(csvTableToPdfBuffer(table).subarray(0, 4).toString()).toBe("%PDF");
    }
  });

  it("aggregates professor student profiles", () => {
    const view = buildProfessorStudentsView(dataset as any);
    expect(view.students[0].weakTopics).toContain("SQL Basics");
    expect(view.students[0].recommendedAction).toContain("intervention");
  });

  it("builds admin summary and moderation queue", () => {
    const summary = buildAdminSummaryView(dataset as any);
    expect(summary.stats.some((item) => item.label === "AI Generations")).toBe(true);
    expect(summary.moderationQueue[0].status).toBe("Needs Review");

    const moderation = buildAdminAiGenerationsView(dataset as any);
    expect(moderation[0].warnings).toContain("Contains advanced questions");
  });

  it("maps subject stats", () => {
    const subjects = buildAdminSubjectsView(dataset as any);
    expect(subjects[0].subject).toBe("Database Systems");
    expect(subjects[0].averagePerformance).toBe(50);
  });
});
