"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminLeaderboardsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ leaderboard: [] }));
  }, []);

  return (
    <AppShell title="Leaderboards" subtitle="Oversight view into top learner performance across the platform.">
      <div className="content grid">
        <section className="card pad">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select className="select" disabled><option>All Classes</option></select>
            <select className="select" disabled><option>All Subjects</option></select>
          </div>
        </section>
        <section className="card">
          <table className="table">
            <thead><tr><th>Rank</th><th>Student</th><th>Quiz</th><th>Score</th><th>Accuracy</th></tr></thead>
            <tbody>
              {(data?.leaderboard ?? []).map((item: any) => (
                <tr key={`${item.rank}-${item.student}`}>
                  <td>{item.rank}</td>
                  <td><strong>{item.student}</strong></td>
                  <td>{item.quiz}</td>
                  <td>{item.score}</td>
                  <td>{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
