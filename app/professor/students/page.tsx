"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, MessageSquare, Search, UserRoundSearch } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";

export default function ProfessorStudentsPage() {
  const [data, setData] = useState<any | null>(null);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const [attentionFlags, setAttentionFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/professor/students")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ classOptions: [], students: [] }));
  }, []);

  const rows = useMemo(() => {
    const all = data?.students ?? [];
    return all.filter((student: any) => {
      const matchesText = !query || `${student.studentName} ${student.email} ${student.classes.join(" ")}`.toLowerCase().includes(query.toLowerCase());
      const matchesClass = !classFilter || student.classes.some((value: string) => value === (data?.classOptions ?? []).find((item: any) => item.id === classFilter)?.label);
      const effectiveRisk = attentionFlags[student.studentId] ? "High" : student.risk;
      const matchesRisk = riskFilter === "All" || effectiveRisk === riskFilter;
      return matchesText && matchesClass && matchesRisk;
    });
  }, [attentionFlags, classFilter, data, query, riskFilter]);

  function toggleAttention(studentId: string) {
    setAttentionFlags((current) => ({ ...current, [studentId]: !current[studentId] }));
  }

  return (
    <AppShell title="Students" subtitle="Track learner health, surface risk early, and open richer student context before you intervene.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>Student Roster</h2>
            <p className="muted small">Search by learner, filter by class or risk, and open a deeper profile before reaching out.</p>
          </div>
          <div className="toolbar-inline">
            <label className="search search-inline">
              <Search size={18} />
              <input placeholder="Search students..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <select className="select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="">All Classes</option>
              {(data?.classOptions ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select className="select" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={5} />)}</div>
        ) : !rows.length ? (
          <EmptyState title="No students match these filters" text="Try widening the search or switching the class and risk filters." />
        ) : (
          <>
            <div className="grid grid-3">
              {rows.slice(0, 3).map((student: any) => (
                <section className="card pad" key={student.studentId}>
                  <div className="section-head">
                    <div>
                      <h3>{student.studentName}</h3>
                      <p className="muted small">{student.classes.join(" · ")}</p>
                    </div>
                    <Badge tone={attentionFlags[student.studentId] || student.risk === "High" ? "amber" : student.risk === "Medium" ? "blue" : "green"}>{attentionFlags[student.studentId] ? "Needs Attention" : `${student.risk} Risk`}</Badge>
                  </div>
                  <div className="grid grid-3">
                    <div className="soft-panel pad-sm"><span className="muted small">Average</span><strong style={{ display: "block" }}>{student.averageScore}%</strong></div>
                    <div className="soft-panel pad-sm"><span className="muted small">XP</span><strong style={{ display: "block" }}>{student.xp}</strong></div>
                    <div className="soft-panel pad-sm"><span className="muted small">Badges</span><strong style={{ display: "block" }}>{student.unlockedBadges.length}</strong></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                    <button className="btn primary" onClick={() => setSelected(student)} type="button"><UserRoundSearch size={16} />Open Profile</button>
                    <button className="btn" onClick={() => toggleAttention(student.studentId)} type="button"><AlertTriangle size={16} />{attentionFlags[student.studentId] ? "Clear Flag" : "Flag Attention"}</button>
                    <button className="btn" disabled type="button"><MessageSquare size={16} />Message Soon</button>
                  </div>
                </section>
              ))}
            </div>

            <section className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Classes</th>
                    <th>Quizzes Taken</th>
                    <th>Average Score</th>
                    <th>XP / Level</th>
                    <th>Weak Topics</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student: any) => (
                    <tr key={student.studentId}>
                      <td>
                        <strong>{student.studentName}</strong>
                        <div className="muted small">{student.email}</div>
                      </td>
                      <td>{student.classes.join(", ")}</td>
                      <td>{student.quizzesTaken}</td>
                      <td>{student.averageScore}%</td>
                      <td>{student.xp} XP · L{student.level}</td>
                      <td>{student.weakTopics.length ? student.weakTopics.join(", ") : "No major weak topic"}</td>
                      <td><Badge tone={attentionFlags[student.studentId] || student.needsAttention ? "amber" : "green"}>{attentionFlags[student.studentId] ? "Needs Attention" : student.needsAttention ? "Watchlist" : "On Track"}</Badge></td>
                      <td>
                        <div className="table-actions">
                          <button className="linkish" onClick={() => setSelected(student)} type="button">View</button>
                          <button className="linkish" onClick={() => toggleAttention(student.studentId)} type="button">{attentionFlags[student.studentId] ? "Unflag" : "Flag"}</button>
                          <button className="linkish" disabled type="button">Message</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="student-profile-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="student-profile-title">{selected.studentName}</h2>
                  <p className="muted small">{selected.email} · {selected.classes.join(" · ")}</p>
                </div>
                <button className="btn" onClick={() => setSelected(null)} type="button">Close</button>
              </div>
              <div className="grid grid-4">
                <div className="soft-panel pad-sm"><span className="muted small">Average Score</span><strong style={{ display: "block" }}>{selected.averageScore}%</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Accuracy</span><strong style={{ display: "block" }}>{selected.accuracy}%</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Quizzes Taken</span><strong style={{ display: "block" }}>{selected.quizzesTaken}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">XP / Level</span><strong style={{ display: "block" }}>{selected.xp} / L{selected.level}</strong></div>
              </div>
              <div className="grid grid-2">
                <section className="soft-panel pad-sm">
                  <strong>Weak Topics</strong>
                  <p className="muted small">{selected.weakTopics.length ? selected.weakTopics.join(", ") : "No major weak topics surfaced in the current seed data."}</p>
                </section>
                <section className="soft-panel pad-sm">
                  <strong>Recommended Professor Action</strong>
                  <p className="muted small">{selected.recommendedAction}</p>
                </section>
              </div>
              <section className="card">
                <div className="section-head" style={{ padding: "18px 20px 0" }}>
                  <h3>Recent Attempts</h3>
                  <Badge tone="purple">{selected.unlockedBadges.length} badges unlocked</Badge>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.recentAttempts.map((attempt: any) => (
                      <tr key={attempt.id}>
                        <td>{attempt.quizTitle}</td>
                        <td>{attempt.percentage}%</td>
                        <td><Badge tone={attempt.passed ? "green" : "amber"}>{attempt.passed ? "Passed" : "Needs Support"}</Badge></td>
                        <td>{attempt.submittedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={() => toggleAttention(selected.studentId)} type="button">{attentionFlags[selected.studentId] ? "Clear Needs Attention" : "Flag Needs Attention"}</button>
                <button className="btn" disabled type="button">Message Student - Coming Soon</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
