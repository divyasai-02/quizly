import type { Prisma } from "@prisma/client";
export const quizInclude = {
  classroom: true,
  questions: {
    include: { options: { orderBy: { orderIndex: "asc" } } },
    orderBy: { orderIndex: "asc" }
  }
} satisfies Prisma.QuizInclude;

export type QuizWithQuestions = Prisma.QuizGetPayload<{ include: typeof quizInclude }>;

export function questionTypeToUi(type: string) {
  switch (type) {
    case "MCQ_MULTIPLE":
      return "Multiple Answer";
    case "TRUE_FALSE":
      return "True/False";
    case "SHORT_ANSWER":
      return "Short Answer";
    default:
      return "MCQ Single Answer";
  }
}

export function questionTypeFromUi(type?: string) {
  switch (type) {
    case "Multiple Answer":
      return "MCQ_MULTIPLE";
    case "True/False":
      return "TRUE_FALSE";
    case "Fill in the Blank":
    case "Short Answer":
      return "SHORT_ANSWER";
    default:
      return "MCQ_SINGLE";
  }
}

export function mapQuestion(question: QuizWithQuestions["questions"][number]) {
  const correct = Math.max(0, question.options.findIndex((option) => option.isCorrect));
  const correctAnswers = question.options.map((option, index) => option.isCorrect ? index : -1).filter((value) => value >= 0);
  return {
    id: question.id,
    type: question.type === "SHORT_ANSWER" && question.text.toLowerCase().includes("fill in the blank") ? "Fill in the Blank" : questionTypeToUi(question.type),
    text: question.text,
    options: question.options.map((option) => option.text),
    optionIds: question.options.map((option) => option.id),
    correct,
    correctAnswers,
    explanation: question.explanation ?? "",
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    minutes: Math.floor((question.timeLimitSeconds ?? 60) / 60),
    seconds: (question.timeLimitSeconds ?? 60) % 60,
    required: question.required,
    shuffle: question.shuffleOptions,
    sourceLabel: (question.sourceLabel as "Manual" | "Question Bank" | "Template" | "AI Drafted" | undefined) ?? "Manual"
  };
}

export function mapQuizSummary(quiz: QuizWithQuestions, index = 0) {
  return {
    id: quiz.id,
    name: quiz.title,
    title: quiz.title,
    description: quiz.description,
    subject: quiz.subject,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    className: quiz.classroom?.name ?? "Public Quiz",
    questions: quiz.questions.length,
    duration: quiz.timeLimitMinutes,
    status: quiz.status === "PUBLISHED" ? "Live" : quiz.status === "CLOSED" ? "Closed" : "Draft",
    created: quiz.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    totalMarks: quiz.totalMarks,
    passingMarks: quiz.passingMarks,
    iconIndex: index
  };
}

export function mapQuizDetail(quiz: QuizWithQuestions) {
  return {
    ...mapQuizSummary(quiz),
    questionsList: quiz.questions.map(mapQuestion),
    instructions: [
      "Read each question carefully before answering.",
      "You can navigate between questions.",
      "You can mark questions for review.",
      "Your progress will be auto-saved.",
      "Do not refresh or close the tab during the quiz.",
      "The quiz will be auto-submitted when time runs out."
    ]
  };
}

export function mapQuizForStudent(quiz: QuizWithQuestions) {
  return {
    ...mapQuizSummary(quiz),
    questionsList: quiz.questions.map((question) => {
      const mapped = mapQuestion(question);
      return {
        id: mapped.id,
        type: mapped.type,
        text: mapped.text,
        options: mapped.options,
        optionIds: mapped.optionIds,
        marks: mapped.marks,
        minutes: mapped.minutes,
        seconds: mapped.seconds,
        required: mapped.required,
        shuffle: mapped.shuffle
      };
    }),
    instructions: [
      "Read each question carefully before answering.",
      "You can navigate between questions.",
      "You can mark questions for review.",
      "Your progress will be auto-saved.",
      "Do not refresh or close the tab during the quiz.",
      "The quiz will be auto-submitted when time runs out."
    ]
  };
}
