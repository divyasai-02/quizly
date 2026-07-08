import { CircleHelp, MessageCircle, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const helpCards = [
  { title: "Create a quiz", text: "Build details, questions, settings, and publish.", icon: PlayCircle },
  { title: "Manage classes", text: "Invite learners and assign quizzes.", icon: CircleHelp },
  { title: "Contact support", text: "Get help with reports or account access.", icon: MessageCircle }
];

export default function HelpPage() {
  return (
    <AppShell title="Help & Support" subtitle="Find guidance for common Quizly workflows.">
      <div className="content grid grid-3">
        {helpCards.map(({ title, text, icon: Icon }) => (
          <div className="card pad" key={title}>
            <Icon color="var(--purple)" />
            <h3>{title}</h3>
            <p className="muted">{text}</p>
            <button className="btn full">Open</button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
