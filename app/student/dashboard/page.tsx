"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Flame, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard, StatCard } from "@/components/ui";

const statIcons = {
  "Active Quizzes": Sparkles,
  Completed: Trophy,
  XP: Flame,
  Level: BrainCircuit
};

export default function StudentDashboardPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ latestQuizzes: [], badges: [], classes: [], completedHistory: [] }));
  }, []);

  return (
    <AppShell title="Dashboard" subtitle="Stay on top of quizzes, progress, and what to study next.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}</div>
        ) : (
          <>
            <div className="section-head">
              <div>
                <h2>Welcome back, {data.studentName}!</h2>
                <p className="muted">Your learning momentum, assigned quizzes, and coaching suggestions are all here.</p>
              </div>
              <Badge tone="green">Level {data.level}</Badge>
            </div>
            <div className="grid grid-4">
              {[
                { label: "Active Quizzes", value: String(data.activeQuizCount), hint: "Ready to take", tone: "purple" },
                { label: "Completed", value: String(data.completedQuizCount), hint: "Finished attempts", tone: "green" },
                { label: "XP", value: String(data.xp), hint: "Earned so far", tone: "amber" },
                { label: "Level", value: String(data.level), hint: "Current rank", tone: "blue" }
              ].map((stat) => (
                <StatCard key={stat.label} {...stat} icon={statIcons[stat.label as keyof typeof statIcons]} />
              ))}
            </div>

            <section className="ai-panel">
              <div className="grid">
                <Badge tone="purple"><Sparkles size={14} /> AI Study Suggestion</Badge>
                <div>
                  <h2>Continue learning with a targeted next step.</h2>
                  <p className="muted">{data.aiSuggestion}</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn primary" href="/student/classroom">Open classroom</Link>
                  <Link className="btn" href="/student/study-room">Go to study room</Link>
                </div>
              </div>
              <div className="insight-list">
                <div className="insight-item"><span className="muted">Weak topics</span><strong>{data.weakTopics?.join(", ") || "No major weak topics yet"}</strong></div>
                <div className="insight-item"><span className="muted">Average accuracy</span><strong>{data.averageAccuracy}%</strong></div>
                <div className="insight-item"><span className="muted">Classes</span><strong>{data.classes?.length ?? 0} enrolled</strong></div>
                <div className="insight-item"><span className="muted">Badges unlocked</span><strong>{data.badges?.filter((badge: any) => badge.unlocked).length ?? 0}</strong></div>
              </div>
            </section>

            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h3>Latest Quizzes</h3>
                  <Link className="linkish" href="/student/classroom">View all</Link>
                </div>
                <div className="grid">
                  {data.latestQuizzes.map((quiz: any) => (
                    <div className="soft-panel pad-sm" key={quiz.id}>
                      <strong>{quiz.title}</strong>
                      <p className="muted small">{quiz.className} · {quiz.questions} questions · {quiz.duration} min</p>
                      <Link className="btn full" href={`/quiz/${quiz.id}/instructions`}>Open Quiz</Link>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card pad">
                <div className="section-head">
                  <h3>Badges Preview</h3>
                  <Link className="linkish" href="/student/achievements">See all</Link>
                </div>
                <div className="grid">
                  {data.badges.slice(0, 3).map((badge: any) => (
                    <div className="achievement-card" key={badge.name}>
                      <strong>{badge.name}</strong>
                      <p className="muted small">{badge.unlocked ? "Unlocked" : "In progress"}</p>
                      <div className="progress-line"><span style={{ width: `${badge.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
