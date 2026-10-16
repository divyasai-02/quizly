import { QuizBuilderPage } from "@/components/pages/professor/QuizBuilderPage";

export default async function ProfessorEditQuizPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <QuizBuilderPage quizId={params.id} />;
}
