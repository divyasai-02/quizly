import { StudentPracticePage } from "@/components/pages/student/StudentPracticePage";

export default async function StudentPracticeRoute(
  props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const topic = typeof searchParams?.topic === "string" ? searchParams.topic : "General";
  return <StudentPracticePage topic={topic} />;
}
