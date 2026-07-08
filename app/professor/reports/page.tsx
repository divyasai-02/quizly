import { Download, FileText, GraduationCap, UserCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const reports = [
  { title: "Quiz Report", text: "View performance by assessment, question difficulty, and completion outcomes.", icon: FileText },
  { title: "Class Report", text: "Compare class participation, accuracy, and current intervention opportunities.", icon: GraduationCap },
  { title: "Student Report", text: "Review individual learner trends, strengths, and weak-topic history.", icon: UserCircle2 }
];

export default function ProfessorReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Centralize reporting workflows for quizzes, classes, and students.">
      <div className="content grid grid-3">
        {reports.map(({ title, text, icon: Icon }) => (
          <section className="card pad" key={title}>
            <div className="icon-tile"><Icon size={24} /></div>
            <h2>{title}</h2>
            <p className="muted">{text}</p>
            <div className="grid">
              <button className="btn" disabled type="button"><Download size={16} />Export CSV - Coming soon</button>
              <button className="btn" disabled type="button"><Download size={16} />Export PDF - Coming soon</button>
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
