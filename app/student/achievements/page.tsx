import { AppShell } from "@/components/AppShell";

const badges = [
  { name: "Quiz Master", progress: 100, unlocked: true },
  { name: "Knowledgeable", progress: 84, unlocked: false },
  { name: "Collaborator", progress: 70, unlocked: false },
  { name: "Champion", progress: 92, unlocked: false },
  { name: "Speed Solver", progress: 100, unlocked: true },
  { name: "Consistency Star", progress: 60, unlocked: false }
];

export default function StudentAchievementsPage() {
  return (
    <AppShell title="Achievements" subtitle="Track badges, progress, and the milestones you are closing in on.">
      <div className="content grid grid-3">
        {badges.map((badge) => (
          <section className={`card pad achievement-card ${badge.unlocked ? "achievement-unlocked" : "achievement-locked"}`} key={badge.name}>
            <h2>{badge.name}</h2>
            <p className="muted">{badge.unlocked ? "Unlocked" : "Keep going to unlock this badge."}</p>
            <div className="progress-line"><span style={{ width: `${badge.progress}%` }} /></div>
            <strong>{badge.progress}%</strong>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
