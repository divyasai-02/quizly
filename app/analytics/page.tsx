"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download, Lightbulb, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { analyticsApi } from "@/lib/apiClient";

export default function AnalyticsPage() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi.overview().then(setData).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Analytics failed to load."));
  }, []);

  const weakTopics: Array<{ topic: string; incorrect: number }> = data?.weakTopics ?? [];
  const difficultQuestions: Array<{ question: string; incorrect: number }> = [...(data?.questionAnalysis ?? [])].sort((a: any, b: any) => b.incorrect - a.incorrect).slice(0, 3);

  return (
    <AppShell title="Analytics" subtitle="Track performance and gain insights across your classes.">
      <div className="content grid">
        <div className="section-head">
          <h2>Class Overview</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select className="select" disabled><option>All Classes</option></select>
            <select className="select" disabled><option>All Quizzes</option></select>
            <select className="select" disabled><option>Current seed data</option></select>
            <button className="btn primary" disabled title="Coming soon"><Download size={17} />Export Report</button>
          </div>
        </div>

        {error ? <div className="notice">{error}</div> : null}
        {!data ? (
          <div className="grid grid-3">
            {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}
          </div>
        ) : (
          <>
        <section className="ai-panel">
          <div>
            <Badge tone="purple"><Lightbulb size={14} /> AI Teacher Insight</Badge>
            <h2>Reteach {weakTopics[0]?.topic ?? "the most missed topic"} next.</h2>
            <p className="muted">{data.aiRecommendation ?? "Review difficult questions, then generate a short remedial quiz for the class."}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn primary" href={`/professor/create-quiz?ai=open&mode=analytics-remedial&topic=${encodeURIComponent(weakTopics[0]?.topic ?? "Core concepts")}&difficulty=Easy&questionCount=5&tone=Exam-focused`}><ClipboardList size={17} />Generate remedial questions</Link>
              <button className="btn" disabled title="Coming soon">Create revision plan</button>
              <Link className="btn ghost" href="#difficult-questions">Review difficult questions</Link>
            </div>
          </div>
          <div className="insight-list">
            {weakTopics.length ? weakTopics.map((item: any) => (
              <div className="insight-item" key={item.topic}>
                <span className="muted">{item.topic}</span>
                <strong>{item.incorrect}% incorrect</strong>
              </div>
            )) : <div className="insight-item"><span className="muted">Weak topics</span><strong>No submitted attempts yet</strong></div>}
          </div>
        </section>

        <div className="grid grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 18 }}>
          {data.classOverview.map((item: any) => (
            <div className="card pad" key={item.name} style={{ borderBottom: `5px solid var(--${item.tone})` }}>
              <div className={`icon-tile ${item.tone}`}><Users size={24} /></div>
              <h3>{item.name}</h3>
              <p className="muted small">{item.students} Students</p>
              <div style={{ display: "flex", gap: 24 }}>
                <div><span className="muted small">Avg Score</span><strong style={{ display: "block", color: `var(--${item.tone})`, fontSize: 22 }}>{item.score}%</strong></div>
                <div><span className="muted small">Avg Accuracy</span><strong style={{ display: "block", color: `var(--${item.tone})`, fontSize: 22 }}>{item.accuracy}%</strong></div>
              </div>
              <p className="small">Engagement<br /><strong>{item.engagement}</strong></p>
            </div>
          ))}
        </div>

        <section className="card pad">
          <div className="section-head">
            <h3>Performance Comparison (Average Score)</h3>
            <div className="soft-panel" style={{ padding: 18, minWidth: 250 }}>
              <span className="muted">Overall Average Score</span>
              <strong style={{ display: "block", color: "var(--purple)", fontSize: 30 }}>{data.overallAverage}%</strong>
            </div>
          </div>
          <div className="bars">
            {data.classOverview.map((item: any) => (
              <div className="bar-wrap" key={item.name}>
                <strong>{item.score}%</strong>
                <div className="bar" style={{ height: `${item.score * 2}px`, background: `var(--${item.tone})` }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-2">
          <section className="card">
            <div className="section-head" style={{ padding: "18px 20px 0" }}>
              <h3>Student Performance (All Classes)</h3>
              <input className="input" placeholder="Search coming soon" disabled style={{ maxWidth: 220 }} />
            </div>
            <table className="table">
              <thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Avg Score</th><th>Accuracy</th><th>Quizzes</th></tr></thead>
              <tbody>
                {data.studentPerformance.map((learner: any) => (
                  <tr key={`${learner.rank}-${learner.student}`}>
                    <td>{learner.rank}</td>
                    <td><strong>{learner.student}</strong></td>
                    <td>{learner.className}</td>
                    <td style={{ color: "var(--green)", fontWeight: 800 }}>{learner.avgScore}%</td>
                    <td>{learner.accuracy}%</td>
                    <td>{learner.quizzes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card" id="difficult-questions">
            <div className="section-head" style={{ padding: "18px 20px 0" }}>
              <h3>Questions Most Students Got Wrong</h3>
              <select className="select" disabled style={{ maxWidth: 180 }}><option>All Questions</option></select>
            </div>
            <table className="table">
              <thead><tr><th>Question</th><th>Correct %</th><th>Incorrect %</th><th>Avg Time</th><th>Difficulty</th></tr></thead>
              <tbody>
                {data.questionAnalysis.map((row: any) => (
                  <tr key={row.question}>
                    <td><strong>{row.question}</strong></td>
                    <td>{row.correct}%</td>
                    <td>{row.incorrect}%</td>
                    <td>{row.time}</td>
                    <td><Badge tone={row.difficulty === "Easy" ? "green" : row.difficulty === "Hard" ? "pink" : "amber"}>{row.difficulty}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <section className="card pad">
          <h3>Teacher Next Actions</h3>
          <div className="grid grid-3">
            {difficultQuestions.map((item: any) => (
              <div className="soft-panel" style={{ padding: 16 }} key={item.question}>
                <strong>{item.question}</strong>
                <p className="muted small">{item.incorrect}% incorrect. Review this concept before the next quiz.</p>
                <div style={{ marginTop: 10 }}>
                  <Link className="linkish" href={`/professor/create-quiz?ai=open&mode=analytics-remedial&topic=${encodeURIComponent(item.question)}&difficulty=Easy&questionCount=5&tone=Exam-focused`}>Generate remedial questions</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
        </>
        )}
      </div>
    </AppShell>
  );
}
