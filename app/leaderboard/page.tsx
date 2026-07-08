"use client";

import { useEffect, useState } from "react";
import { Flame, Share2, Star, Target, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { leaderboardApi } from "@/lib/apiClient";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    leaderboardApi.list().then((data) => setRows(data.learners)).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Leaderboard failed to load."));
  }, []);
  const top = rows?.slice(0, 3) ?? [];
  const ordered = [top[1], top[0], top[2]];
  const currentLearner = rows?.find((learner) => learner.current) ?? rows?.[0];

  return (
    <AppShell title="Leaderboard" subtitle="Compete, learn and climb the ranks!">
      <div className="content grid">
        <section className="card pad">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <select className="select" disabled style={{ maxWidth: 320 }}><option>All submitted quizzes</option></select>
            <select className="select" disabled style={{ maxWidth: 220 }}><option>Seeded attempts</option></select>
            <button className="btn primary">Global</button>
            <button className="btn" disabled title="Coming soon">Friends</button>
          </div>
        </section>

        {error ? <div className="notice">{error}</div> : null}
        {!rows ? <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div> : (
          <>
        <div className="podium">
          {ordered.filter(Boolean).map((learner) => (
            <div className={`card winner ${learner.rank === 1 ? "first" : ""}`} key={learner.rank}>
              <Badge tone={learner.rank === 1 ? "amber" : learner.rank === 2 ? "purple" : "pink"}>#{learner.rank}</Badge>
              <div className="big-avatar">{learner.initials}</div>
              <h2>{learner.name}</h2>
              <Badge>{learner.tag}</Badge>
              <strong style={{ display: "block", marginTop: 16, color: "var(--purple)", fontSize: 28 }}>{learner.xp.toLocaleString()} XP</strong>
            </div>
          ))}
        </div>

        <section className="card">
          <table className="table">
            <thead><tr><th>Rank</th><th>Learner</th><th>Score</th><th>Accuracy</th><th>Streak</th></tr></thead>
            <tbody>
              {rows.slice(3).map((learner) => (
                <tr key={learner.rank} style={learner.current ? { background: "#f4efff", outline: "1px solid #bda8ff" } : undefined}>
                  <td><strong>{learner.rank}</strong></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="avatar-sm">{learner.initials}</div>
                      <div><strong>{learner.name}</strong><br /><Badge>{learner.tag}</Badge></div>
                    </div>
                  </td>
                  <td><strong>{learner.xp.toLocaleString()} XP</strong></td>
                  <td>
                    <strong>{learner.accuracy}%</strong>
                    <div className="progress-line" style={{ maxWidth: 120, marginTop: 6 }}><span style={{ width: `${learner.accuracy}%`, background: learner.current ? "var(--purple)" : "var(--green)" }} /></div>
                  </td>
                  <td><strong style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{learner.streak} <Flame size={16} color="var(--pink)" /></strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length <= 3 ? <EmptyState title="No additional learners yet" text="The podium includes every submitted learner in the seeded data." /> : null}
          <div style={{ padding: 18, textAlign: "center" }}><button className="linkish" disabled>Full leaderboard coming soon</button></div>
        </section>

        <section className="card pad">
          <h3>Your Performance Overview</h3>
          <div className="grid grid-4">
            <div className="card pad"><Trophy color="var(--purple)" /><p>Your Rank</p><strong style={{ fontSize: 26 }}>{currentLearner?.rank ?? "-"}</strong><p className="muted small">Out of {rows.length}</p></div>
            <div className="card pad"><Star color="var(--amber)" /><p>Total XP</p><strong style={{ fontSize: 26 }}>{currentLearner?.xp?.toLocaleString() ?? "0"}</strong><p className="muted small">From submitted attempts</p></div>
            <div className="card pad"><Target color="var(--blue)" /><p>Accuracy</p><strong style={{ fontSize: 26 }}>{currentLearner?.accuracy ?? 0}%</strong><p className="muted small">Backend average</p></div>
            <div className="card pad"><Zap color="var(--pink)" /><p>Best Streak</p><strong style={{ fontSize: 26 }}>{currentLearner?.streak ?? 0} Days</strong><p className="muted small">Demo metric</p></div>
          </div>
          <div className="soft-panel" style={{ marginTop: 18, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
            <Trophy color="var(--purple)" />
            <strong className="spacer">{currentLearner ? `You are #${currentLearner.rank} on this seeded leaderboard` : "No learner data yet"}</strong>
            <button className="btn primary" disabled title="Coming soon"><Share2 size={17} />Share Rank</button>
          </div>
        </section>
        </>
        )}
      </div>
    </AppShell>
  );
}
