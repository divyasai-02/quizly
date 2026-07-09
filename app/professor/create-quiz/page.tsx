import { QuizBuilderPage } from "@/components/pages/professor/QuizBuilderPage";

export default function ProfessorCreateQuizPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const aiOpen = searchParams?.ai === "open";
  const topic = typeof searchParams?.topic === "string" ? searchParams.topic : undefined;
  const subject = typeof searchParams?.subject === "string" ? searchParams.subject : undefined;
  const difficulty = typeof searchParams?.difficulty === "string" ? searchParams.difficulty as "Easy" | "Medium" | "Hard" | "Mixed" : undefined;
  const questionCount = typeof searchParams?.questionCount === "string" ? Number(searchParams.questionCount) : undefined;
  const tone = typeof searchParams?.tone === "string" ? searchParams.tone as "Simple" | "Exam-focused" | "Conceptual" | "Placement prep" : undefined;
  const mode = searchParams?.mode === "analytics-remedial" ? "analytics-remedial" : "quiz-builder";

  return <QuizBuilderPage initialAiState={{ open: aiOpen, mode, topic, subject, difficulty, questionCount, tone }} />;
}
