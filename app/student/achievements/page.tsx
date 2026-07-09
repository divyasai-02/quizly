"use client";

import { useEffect, useState } from "react";
import { Award, BrainCircuit } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SkeletonCard } from "@/components/ui";
import { studentApi } from "@/lib/apiClient";

export default function StudentAchievementsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    studentApi.learningSummary().then(setData).catch(() => setData({ xp: 0, level: 1, badges: [] }));
  }, []);

  return (
    <AppShell title="Achievements" subtitle="Track badges, progress, XP, and the milestones you are closing in on.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <>
            <section className="card pad">
              <div className="section-head">
                <div>
                  <h2>XP and Level Progress</h2>
                  <p className="muted">Your badges and level are derived deterministically from completed quiz attempts.</p>
                </div>
                <BrainCircuit color="var(--purple)" />
              </div>
              <div className="grid grid-3">
                <div className="card pad"><strong>{data.xp}</strong><br /><span className="muted small">Total XP</span></div>
                <div className="card pad"><strong>{data.level}</strong><br /><span className="muted small">Current Level</span></div>
                <div className="card pad"><strong>{data.badges.filter((badge: any) => badge.unlocked).length}</strong><br /><span className="muted small">Unlocked Badges</span></div>
              </div>
              <div className="progress-line" style={{ marginTop: 18 }}><span style={{ width: `${Math.min(100, ((data.xp % 400) / 400) * 100)}%` }} /></div>
            </section>

            <div className="grid grid-3">
              {data.badges.map((badge: any) => (
                <section className={`card pad achievement-card ${badge.unlocked ? "achievement-unlocked" : "achievement-locked"}`} key={badge.name}>
                  <div className="section-head" style={{ marginBottom: 8 }}>
                    <h2>{badge.name}</h2>
                    <Award color={badge.unlocked ? "var(--amber)" : "var(--muted)"} />
                  </div>
                  <p className="muted">{badge.criteria}</p>
                  <div className="progress-line"><span style={{ width: `${badge.progress}%` }} /></div>
                  <strong>{badge.progress}%</strong>
                  <p className="muted small">{badge.unlocked ? "Unlocked" : "Keep going to unlock this badge."}</p>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
