import { AIInsightType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const generatedQuestions = [
  {
    type: "MCQ Single Answer",
    text: "Which keyword creates a block-scoped variable in JavaScript?",
    options: ["var", "let", "function", "return"],
    correct: 1,
    explanation: "let creates block-scoped variables and is preferred for values that can change.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false
  },
  {
    type: "MCQ Single Answer",
    text: "Which DBMS concept helps reduce data redundancy?",
    options: ["Normalization", "Compilation", "Routing", "Paging"],
    correct: 0,
    explanation: "Normalization structures tables to reduce redundancy and update anomalies.",
    marks: 1,
    negativeMarks: 0,
    minutes: 1,
    seconds: 0,
    required: true,
    shuffle: false
  }
];

async function record(type: AIInsightType, input: unknown, output: unknown, links: { quizId?: string; attemptId?: string; classroomId?: string; userId?: string } = {}) {
  await prisma.aIInsight.create({
    data: {
      type,
      inputJson: JSON.stringify(input),
      outputJson: JSON.stringify(output),
      ...links
    }
  });
  return output;
}

export const aiService = {
  async generateQuiz(input: { prompt?: string; topic?: string; count?: number; userId?: string }) {
    // TODO: Replace this deterministic mock with Gemini/OpenAI once API keys are configured.
    const output = {
      title: `${input.topic ?? "AI"} Practice Quiz`,
      questions: generatedQuestions.slice(0, input.count ?? generatedQuestions.length)
    };
    return record(AIInsightType.QUIZ_GENERATION, input, output, { userId: input.userId });
  },

  async generateFromNotes(input: { notes?: string; userId?: string }) {
    const output = {
      title: "Notes Based Quiz",
      questions: generatedQuestions
    };
    return record(AIInsightType.QUIZ_GENERATION, input, output, { userId: input.userId });
  },

  async improveQuestion(input: { text?: string; userId?: string }) {
    const output = {
      text: `${input.text ?? "Question"} Be precise and choose the best answer.`,
      rationale: "Clarified wording and reduced ambiguity."
    };
    return record(AIInsightType.QUESTION_IMPROVEMENT, input, output, { userId: input.userId });
  },

  async generateExplanation(input: { question?: string; answer?: string; userId?: string }) {
    const output = {
      explanation: "The correct answer follows directly from the core concept being tested. Review the related topic once more for confidence."
    };
    return record(AIInsightType.QUESTION_IMPROVEMENT, input, output, { userId: input.userId });
  },

  async analyzeAttempt(input: { attemptId?: string; score?: number; percentage?: number; userId?: string }) {
    const weakTopics = input.percentage && input.percentage >= 70 ? ["Applied edge cases"] : ["Core concepts", "Question interpretation"];
    const output = {
      feedback: input.percentage && input.percentage >= 70
        ? "Strong attempt. You are ready for higher-difficulty practice, but review the explanations for any missed edge cases."
        : "Good start. Your next win is to slow down on fundamentals, compare missed answers with explanations, and retry a short revision set.",
      strongTopics: input.percentage && input.percentage >= 70 ? ["Recall", "Basic application"] : ["Attempt completion"],
      weakTopics,
      nextSteps: [
        `Review explanations for ${weakTopics[0]}.`,
        "Write one sentence explaining why each correct answer is correct.",
        "Take a 5-question revision quiz before moving to the next topic."
      ],
      practiceAction: `Generate a short practice quiz focused on ${weakTopics[0]}.`
    };
    return record(AIInsightType.ATTEMPT_FEEDBACK, input, output, { attemptId: input.attemptId, userId: input.userId });
  },

  async generateTeacherInsights(input: { classroomId?: string; quizId?: string; userId?: string }) {
    const output = {
      summary: "Most learners are performing well on direct recall questions. Add more applied questions for deeper understanding.",
      recommendations: ["Add one medium DBMS quiz", "Review strict mode and normalization", "Celebrate top improvers"]
    };
    return record(AIInsightType.TEACHER_ANALYTICS, input, output, input);
  }
};
