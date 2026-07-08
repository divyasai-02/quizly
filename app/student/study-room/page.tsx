import { BrainCircuit, Clock3, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const cards = [
  { title: "Topic-wise Practice", text: "Jump into targeted practice sets for JavaScript, DBMS, OS, and Aptitude.", icon: BrainCircuit },
  { title: "Weak Topic Review", text: "Revisit recently missed ideas with short, focused revision loops.", icon: Clock3 },
  { title: "AI Practice Quiz", text: "Generate a personalized practice drill based on recent quiz performance.", icon: Sparkles }
];

export default function StudyRoomPage() {
  return (
    <AppShell title="Study Room" subtitle="Practice smarter with revision prompts, weak-topic focus, and spaced review.">
      <div className="content grid grid-3">
        {cards.map(({ title, text, icon: Icon }) => (
          <section className="card pad" key={title}>
            <div className="icon-tile"><Icon size={24} /></div>
            <h2>{title}</h2>
            <p className="muted">{text}</p>
            <button className="btn full" disabled type="button">Coming soon</button>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
