import { QuizBuilderPage } from "@/components/pages/professor/QuizBuilderPage";

export default function ProfessorEditQuizPage({ params }: { params: { id: string } }) {
  return <QuizBuilderPage quizId={params.id} />;
}
