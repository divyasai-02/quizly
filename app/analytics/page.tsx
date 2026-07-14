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
  const [classFilter, setClassFilter] = useState("All");
  const [quizFilter, setQuizFilter] = useState("All");
  const [studentSearch, setStudentSearch] = useState("");
  const [questionFilter, setQuestionFilter] = useState("All");

  useEffect(() => {
    analyticsApi.overview().then(setData).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Analytics failed to load."));
  }, []);

  const classes = ["All", ...new Set((data?.classOverview ?? []).map((item: any) => item.name))] as string[];
  const quizzes = ["All", ...new Set((data?.quizzes ?? []).filter((quiz: any) => classFilter === "All" || quiz.className === classFilter).map((quiz: any) => quiz.title))] as string[];
  const filteredClassOverview = (data?.classOverview ?? []).filter((item: any) => classFilter === "All" || item.name === classFilter);
  const filteredStudents = (data?.studentPerformance ?? []).filter((learner: any) => {
    const query = studentSearch.trim().toLowerCase();
    if (classFilter !== "All" && learner.className !== classFilter) return false;
    if (quizFilter !== "All" && learner.quizTitle !== quizFilter) return false;
    if (query && ![learner.student, learner.className, learner.quizTitle].some((value) => String(value).toLowerCase().includes(query))) return false;
    return true;
  });
  const filteredQuestions = (data?.questionAnalysis ?? []).filter((row: any) => {
    if (classFilter !== "All" && row.className !== classFilter) return false;
    if (quizFilter !== "All" && row.quizTitle !== quizFilter) return false;
    if (questionFilter !== "All" && row.difficulty !== questionFilter) return false;
    return true;
  });
  const weakTopics: Array<{ topic: string; incorrect: number }> = data?.weakTopics ?? [];
  const difficultQuestions: Array<{ question: string; incorrect: number }> = [...filteredQuestions].sort((a: any, b: any) => b.incorrect - a.incorrect).slice(0, 3);
  const visibleAverage = filteredClassOverview.length ? Math.round(filteredClassOverview.reduce((sum: number, item: any) => sum + item.score, 0) / filteredClassOverview.length) : 0;

  return (
    <AppShell title="Analytics" subtitle="Track performance and gain insights across your classes.">
      <div className="content grid">
        <div className="section-head">
          <h2>Class Overview</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select className="select" value={classFilter} onChange={(event) => { setClassFilter(event.target.value); setQuizFilter("All"); }} aria-label="Class filter">{classes.map((item) => <option key={item}>{item === "All" ? "All Classes" : item}</option>)}</select>
            <select className="select" value={quizFilter} onChange={(event) => setQuizFilter(event.target.value)} aria-label="Quiz filter">{quizzes.map((item) => <option key={item}>{item === "All" ? "All Quizzes" : item}</option>)}</select>
            <select className="select" value={questionFilter} onChange={(event) => setQuestionFilter(event.target.value)} aria-label="Difficulty filter"><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            <Link className="btn primary" href="/professor/reports"><Download size={17} />Open Reports</Link>
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
              <Link
                className="btn"
                href={`/professor/create-quiz?ai=open&mode=analytics-remedial&topic=${encodeURIComponent(weakTopics[0]?.topic ?? "Core concepts")}&difficulty=Easy&questionCount=5&tone=Exam-focused`}
              >
                Create revision plan
              </Link>
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
          {filteredClassOverview.map((item: any) => (
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
              <strong style={{ display: "block", color: "var(--purple)", fontSize: 30 }}>{visibleAverage}%</strong>
            </div>
          </div>
          <div className="bars">
            {filteredClassOverview.map((item: any) => (
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
              <h3>Student Performance ({classFilter === "All" ? "All Classes" : classFilter})</h3>
              <input className="input" placeholder="Search students, classes, quizzes" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} style={{ maxWidth: 260 }} />
            </div>
            <table className="table">
              <thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Avg Score</th><th>Accuracy</th><th>Quizzes</th></tr></thead>
              <tbody>
                {filteredStudents.map((learner: any, index: number) => (
                  <tr key={`${learner.rank}-${learner.student}`}>
                    <td>{index + 1}</td>
                    <td><strong>{learner.student}</strong></td>
                    <td>{learner.className}</td>
                    <td style={{ color: "var(--green)", fontWeight: 800 }}>{learner.avgScore}%</td>
                    <td>{learner.accuracy}%</td>
                    <td>{learner.quizzes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredStudents.length ? <div className="pad"><p className="muted">No student results match these filters.</p></div> : null}
          </section>

          <section className="card" id="difficult-questions">
            <div className="section-head" style={{ padding: "18px 20px 0" }}>
              <h3>Questions Most Students Got Wrong</h3>
              <select className="select" value={questionFilter} onChange={(event) => setQuestionFilter(event.target.value)} style={{ maxWidth: 180 }}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            </div>
            <table className="table">
              <thead><tr><th>Question</th><th>Correct %</th><th>Incorrect %</th><th>Avg Time</th><th>Difficulty</th></tr></thead>
              <tbody>
                {filteredQuestions.map((row: any) => (
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
            {!filteredQuestions.length ? <div className="pad"><p className="muted">No question results match these filters.</p></div> : null}
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
