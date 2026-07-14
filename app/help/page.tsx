import Link from "next/link";
import { CircleHelp, MessageCircle, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const helpCards = [
  { title: "Create a quiz", text: "Build details, questions, settings, and publish.", icon: PlayCircle, href: "/professor/create-quiz", cta: "Open quiz builder" },
  { title: "Manage classes", text: "Invite learners and assign quizzes.", icon: CircleHelp, href: "/professor/classes", cta: "Open classes" },
  { title: "Contact support", text: "Review reports, settings, and demo guidance for this phase.", icon: MessageCircle, href: "/professor/reports", cta: "Open reports" }
];

export default function HelpPage() {
  return (
    <AppShell title="Help & Support" subtitle="Find guidance for common Quizly workflows.">
      <div className="content grid grid-3">
        {helpCards.map(({ title, text, icon: Icon, href, cta }) => (
          <div className="card pad" key={title}>
            <Icon color="var(--purple)" />
            <h3>{title}</h3>
            <p className="muted">{text}</p>
            <Link className="btn full" href={href}>{cta}</Link>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
