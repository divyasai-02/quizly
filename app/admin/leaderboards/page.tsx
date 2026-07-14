"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminLeaderboardsPage() {
  const [data, setData] = useState<any | null>(null);
  const [classFilter, setClassFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ leaderboard: [] }));
  }, []);

  const classOptions = useMemo(() => ["All", ...new Set<string>((data?.leaderboard ?? []).map((item: any) => String(item.className)))], [data]);
  const subjectOptions = useMemo(() => ["All", ...new Set<string>((data?.leaderboard ?? []).map((item: any) => String(item.subject)))], [data]);
  const rows = useMemo(() => {
    return (data?.leaderboard ?? []).filter((item: any) => {
      if (classFilter !== "All" && item.className !== classFilter) return false;
      if (subjectFilter !== "All" && item.subject !== subjectFilter) return false;
      return true;
    }).map((item: any, index: number) => ({ ...item, rank: index + 1 }));
  }, [classFilter, data, subjectFilter]);

  return (
    <AppShell title="Leaderboards" subtitle="Oversight view into top learner performance across the platform.">
      <div className="content grid">
        <section className="card pad">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select className="select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              {classOptions.map((item) => <option key={item}>{item === "All" ? "All Classes" : item}</option>)}
            </select>
            <select className="select" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              {subjectOptions.map((item) => <option key={item}>{item === "All" ? "All Subjects" : item}</option>)}
            </select>
          </div>
        </section>
        <section className="card">
          <table className="table">
            <thead><tr><th>Rank</th><th>Student</th><th>Quiz</th><th>Score</th><th>Accuracy</th></tr></thead>
            <tbody>
              {rows.map((item: any) => (
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
          {!rows.length ? <div className="pad"><p className="muted">No leaderboard rows match these filters.</p></div> : null}
        </section>
      </div>
    </AppShell>
  );
}
