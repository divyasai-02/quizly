import { StudentPracticePage } from "@/components/pages/student/StudentPracticePage";

export default function StudentPracticeRoute({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const topic = typeof searchParams?.topic === "string" ? searchParams.topic : "General";
  return <StudentPracticePage topic={topic} />;
}
