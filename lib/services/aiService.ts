import { AIInsightType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateExplanation, generateQuizDraft, improveQuestion } from "@/lib/services/aiQuizGenerationService";

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
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      topic: input.topic ?? input.prompt,
      questionCount: input.count ?? 2,
      userId: input.userId
    });
    return {
      title: `${input.topic ?? input.prompt ?? "AI"} Practice Quiz`,
      provider: output.provider,
      warnings: output.warnings,
      questions: output.questions.map((question) => ({
        ...question,
        options: question.options.map((option) => option.text)
      }))
    };
  },

  async generateFromNotes(input: { notes?: string; userId?: string }) {
    const output = await generateQuizDraft({
      mode: "quiz-builder",
      pastedNotes: input.notes,
      questionCount: 4,
      userId: input.userId
    });
    return {
      title: "Notes Based Quiz",
      provider: output.provider,
      warnings: output.warnings,
      questions: output.questions.map((question) => ({
        ...question,
        options: question.options.map((option) => option.text)
      }))
    };
  },

  improveQuestion,
  generateExplanation,

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
