import { describe, expect, it } from "vitest";
import {
  buildPracticeQuestions,
  calculateProgressBadges,
  calculateXpForAttempt,
  mapAttemptReview,
  scorePracticeSubmission,
  summarizeAttemptLearning
} from "./studentLearningService";

describe("studentLearningService", () => {
  const attempt = {
    id: "attempt-1",
    score: 2,
    percentage: 50,
    passed: false,
    timeTakenSeconds: 620,
    status: "SUBMITTED",
    quiz: {
      id: "quiz-1",
      title: "DBMS Quiz",
      subject: "DBMS",
      topic: "DBMS",
      difficulty: "Medium",
      timeLimitMinutes: 15,
      totalMarks: 4,
      passingMarks: 3,
      questions: [
        {
          id: "q1",
          text: "Which normal form removes partial dependency?",
          topicTag: "Normalization",
          difficulty: "Medium",
          explanation: "2NF removes partial dependency.",
          marks: 1,
          options: [
            { id: "q1a", text: "1NF", isCorrect: false },
            { id: "q1b", text: "2NF", isCorrect: true }
          ]
        },
        {
          id: "q2",
          text: "SQL stands for?",
          topicTag: "SQL Basics",
          difficulty: "Easy",
          explanation: "Structured Query Language.",
          marks: 1,
          options: [
            { id: "q2a", text: "Structured Query Language", isCorrect: true },
            { id: "q2b", text: "Simple Query Logic", isCorrect: false }
          ]
        },
        {
          id: "q3",
          text: "HAVING filters grouped rows.",
          topicTag: "SQL Basics",
          difficulty: "Hard",
          explanation: "HAVING works after aggregation.",
          marks: 1,
          options: [
            { id: "q3a", text: "True", isCorrect: true },
            { id: "q3b", text: "False", isCorrect: false }
          ]
        },
        {
          id: "q4",
          text: "A primary key can be null.",
          topicTag: "Keys",
          difficulty: "Easy",
          explanation: "Primary keys cannot be null.",
          marks: 1,
          options: [
            { id: "q4a", text: "True", isCorrect: false },
            { id: "q4b", text: "False", isCorrect: true }
          ]
        }
      ]
    },
    answers: [
      { questionId: "q1", marksAwarded: 1, markedForReview: false, selectedOptionIds: ["q1b"], isCorrect: true },
      { questionId: "q2", marksAwarded: 0, markedForReview: false, selectedOptionIds: ["q2b"], isCorrect: false },
      { questionId: "q3", marksAwarded: 0, markedForReview: true, selectedOptionIds: [], isCorrect: false },
      { questionId: "q4", marksAwarded: 1, markedForReview: false, selectedOptionIds: ["q4b"], isCorrect: true }
    ]
  };

  it("maps attempt review records with selected and correct answers", () => {
    const review = mapAttemptReview(attempt);
    expect(review).toHaveLength(4);
    expect(review[1].status).toBe("Incorrect");
    expect(review[1].selectedAnswer).toEqual(["Simple Query Logic"]);
    expect(review[1].correctAnswer).toEqual(["Structured Query Language"]);
    expect(review[2].status).toBe("Unanswered");
  });

  it("calculates weak topics and feedback from an attempt", () => {
    const summary = summarizeAttemptLearning({ attempt });
    expect(summary.correctCount).toBe(2);
    expect(summary.incorrectCount).toBe(1);
    expect(summary.unansweredCount).toBe(1);
    expect(summary.weakTopics[0].topic).toBe("SQL Basics");
    expect(summary.feedback.revisionSteps).toHaveLength(3);
  });

  it("calculates XP for attempts deterministically", () => {
    const xp = calculateXpForAttempt({
      score: 3,
      percentage: 75,
      passed: true,
      totalMarks: 4,
      timeTakenSeconds: 500,
      suggestedTimeMinutes: 15
    });
    expect(xp).toBeGreaterThan(0);
  });

  it("calculates badge unlock progress", () => {
    const progress = calculateProgressBadges([
      { id: "1", quizId: "qz1", title: "Quiz 1", subject: "DBMS", topic: "Normalization", difficulty: "Easy", percentage: 92, score: 4, passed: true, status: "SUBMITTED", timeTakenSeconds: 400, suggestedTimeMinutes: 15, createdAt: new Date("2026-07-01") },
      { id: "2", quizId: "qz2", title: "Quiz 2", subject: "OS", topic: "Scheduling", difficulty: "Medium", percentage: 88, score: 3, passed: true, status: "SUBMITTED", timeTakenSeconds: 450, suggestedTimeMinutes: 15, createdAt: new Date("2026-07-02") },
      { id: "3", quizId: "qz3", title: "Quiz 3", subject: "CN", topic: "DNS", difficulty: "Medium", percentage: 55, score: 2, passed: false, status: "SUBMITTED", timeTakenSeconds: 700, suggestedTimeMinutes: 15, createdAt: new Date("2026-07-03") },
      { id: "4", quizId: "qz4", title: "Quiz 4", subject: "Java", topic: "Closures", difficulty: "Medium", percentage: 85, score: 3, passed: true, status: "SUBMITTED", timeTakenSeconds: 380, suggestedTimeMinutes: 15, createdAt: new Date("2026-07-04") },
      { id: "5", quizId: "qz5", title: "Quiz 5", subject: "Aptitude", topic: "Ratios", difficulty: "Easy", percentage: 91, score: 4, passed: true, status: "SUBMITTED", timeTakenSeconds: 360, suggestedTimeMinutes: 15, createdAt: new Date("2026-07-05") }
    ]);
    expect(progress.badges.find((badge) => badge.name === "Quiz Master")?.unlocked).toBe(true);
    expect(progress.badges.find((badge) => badge.name === "Accuracy Ace")?.unlocked).toBe(true);
  });

  it("maps practice questions and scores practice submissions", () => {
    const sourceQuestions = [
      {
        id: "bank-1",
        text: "SQL stands for?",
        explanation: "Structured Query Language.",
        subject: "DBMS",
        topic: "SQL Basics",
        difficulty: "Easy",
        options: [
          { id: "a", text: "Structured Query Language", isCorrect: true },
          { id: "b", text: "Simple Query Logic", isCorrect: false }
        ],
        source: "question-bank" as const
      },
      {
        id: "bank-2",
        text: "Round Robin uses a time quantum.",
        explanation: "Time quantum drives Round Robin scheduling.",
        subject: "OS",
        topic: "Scheduling",
        difficulty: "Easy",
        options: [
          { id: "c", text: "True", isCorrect: true },
          { id: "d", text: "False", isCorrect: false }
        ],
        source: "question-bank" as const
      }
    ];
    const questions = buildPracticeQuestions("SQL", sourceQuestions);
    const result = scorePracticeSubmission(questions, [{ questionId: questions[0].id, selectedOptionIds: [questions[0].correctOptionIds[0]] }]);
    expect(questions).toHaveLength(1);
    expect(result.correct).toBe(1);
    expect(result.percentage).toBe(100);
  });

  it("supports fuzzy topic labels and general fallback practice", () => {
    const sourceQuestions = [
      {
        id: "bank-1",
        text: "SQL stands for?",
        explanation: "Structured Query Language.",
        subject: "DBMS",
        topic: "SQL",
        difficulty: "Easy",
        options: [
          { id: "a", text: "Structured Query Language", isCorrect: true },
          { id: "b", text: "Simple Query Logic", isCorrect: false }
        ],
        source: "question-bank" as const
      },
      {
        id: "bank-2",
        text: "Round Robin uses a time quantum.",
        explanation: "Time quantum drives Round Robin scheduling.",
        subject: "OS",
        topic: "Scheduling",
        difficulty: "Easy",
        options: [
          { id: "c", text: "True", isCorrect: true },
          { id: "d", text: "False", isCorrect: false }
        ],
        source: "question-bank" as const
      }
    ];

    expect(buildPracticeQuestions("SQL Basics", sourceQuestions).map((question) => question.id)).toEqual(["bank-1"]);
    expect(buildPracticeQuestions("General", sourceQuestions)).toHaveLength(2);
  });
});
