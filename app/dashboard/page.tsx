"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, BookOpen, CheckCircle2, ChevronRight, ClipboardList, FileQuestion, GraduationCap, Library, Lock, MoreVertical, PlayCircle, Plus, Sparkles, Upload, Wand2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard, StatCard } from "@/components/ui";
import { dashboardApi } from "@/lib/apiClient";
import { isLiveQuiz, quizStatusLabel, quizStatusTone } from "@/lib/status";

const statIcons = { Classes: ClipboardList, "Active Quizzes": PlayCircle, Drafts: FileQuestion, Completed: CheckCircle2, "Closed Quizzes": Lock };
const quizIcons = [BookOpen, ClipboardList, FileQuestion, GraduationCap, BarChart3];
const quickActions = ["Create Quiz", "Import Questions", "Question Bank", "AI Generator"];

type DashboardSummary = {
  stats: Array<{ label: string; value: string; hint: string; tone: string; icon: typeof ClipboardList }>;
  classes: Array<{ id?: string; code: string; name: string; students: number; quizzes: number; activity: string }>;
  quizzes: Array<any & { icon: typeof ClipboardList }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi.summary()
      .then((data) => {
        setSummary({
          stats: data.stats.map((item) => ({ ...item, icon: statIcons[item.label as keyof typeof statIcons] ?? ClipboardList })),
          classes: data.classes,
          quizzes: data.quizzes.map((item, index) => ({ ...item, icon: quizIcons[index % quizIcons.length] }))
        });
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Dashboard failed to load."));
  }, []);

  const liveQuizzes = summary?.quizzes.filter((quiz) => isLiveQuiz(quiz.status)) ?? [];
  const weakestTopic = summary?.quizzes.find((quiz) => quiz.status !== "Live")?.topic ?? summary?.quizzes[0]?.topic ?? "No weak topic yet";
  const atRiskStudents = summary ? Math.max(0, summary.classes.reduce((total, item) => total + Math.max(0, item.students - 2), 0)) : 0;
  const classSummary = summary
    ? `${summary.classes.length} classes, ${liveQuizzes.length} live quizzes, ${summary.stats.find((item) => item.label === "Drafts")?.value ?? "0"} drafts`
    : "";

  return (
    <AppShell title="Dashboard" subtitle="Here's what's happening with your quizzes today.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>Welcome back, Prof. John!</h2>
            <p className="muted">Manage classes, launch quizzes, and review recent activity.</p>
          </div>
          <Link className="btn primary" href="/professor/create-quiz">
            <Plus size={18} />
            Create Quiz
          </Link>
        </div>

        {error ? <div className="notice">{error}</div> : null}

        {!summary ? (
          <>
            <div className="grid grid-5">
              {Array.from({ length: 5 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}
            </div>
            <SkeletonCard lines={4} />
          </>
        ) : (
          <>
            <section className="ai-panel">
              <div className="grid">
                <Badge tone="purple"><Wand2 size={14} /> AI Teaching Assistant</Badge>
                <div>
                  <h2 style={{ margin: "6px 0" }}>Good morning, Professor. Here is where I would focus today.</h2>
                  <p className="muted">Your assistant is tracking class readiness, draft work, and quiz performance so the next teaching action is visible before you open analytics.</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn primary" href="/professor/create-quiz?ai=open"><Sparkles size={17} />Generate Quiz with AI</Link>
                  <Link className="btn" href="/professor/analytics"><ClipboardList size={17} />Review Weak Topics</Link>
                  <button className="btn ghost" disabled title="Coming soon">Create Revision Plan</button>
                </div>
              </div>
              <div className="insight-list">
                <div className="insight-item"><span className="muted">Class summary</span><strong>{classSummary}</strong></div>
                <div className="insight-item"><span className="muted">Weakest topic</span><strong>{weakestTopic}</strong></div>
                <div className="insight-item"><span className="muted">At-risk students</span><strong>{atRiskStudents}</strong></div>
                <div className="insight-item"><span className="muted">Recommended action</span><strong>Review difficult questions, then generate a short revision quiz.</strong></div>
              </div>
            </section>

            <div className="grid grid-5">
              {summary.stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
          </>
        )}

        {summary ? <div className="grid grid-2">
          <section className="card pad">
            <div className="section-head">
              <h3>My Classes</h3>
              <Link className="linkish" href="/classes">View all</Link>
            </div>
            {summary.classes.map((item, index) => (
              <div className="row-item" key={item.name}>
                <div className={`icon-tile ${["purple", "green", "amber", "pink"][index]}`} style={{ width: 42, height: 42 }}>
                  {item.code}
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted small">
                    {item.students} students - {item.quizzes} quizzes
                  </div>
                </div>
                <span className="spacer" />
                <div className="muted small">Last activity<br />{item.activity}</div>
                <ChevronRight size={18} className="muted" />
              </div>
            ))}
            <button className="btn full" style={{ marginTop: 14 }} disabled title="Coming soon">
              <Plus size={16} />
              Add New Class - Coming soon
            </button>
          </section>

          <section className="card pad">
            <div className="section-head">
              <h3>Active Quizzes</h3>
              <Link className="linkish" href="#quizzes">View all</Link>
            </div>
            {liveQuizzes.slice(0, 4).map((quiz, index) => {
              const Icon = quiz.icon;
              return (
                <div className="row-item" key={quiz.id}>
                  <div className={`icon-tile ${["purple", "green", "amber", "pink"][index]}`} style={{ width: 42, height: 42 }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <strong>{quiz.name}</strong>
                    <div className="muted small">
                      {quiz.className} - {quiz.questions} Questions
                    </div>
                  </div>
                  <span className="spacer" />
                  <Badge tone={quizStatusTone(quiz.status)}>{quizStatusLabel(quiz.status)}</Badge>
                  <div className="muted small">{quiz.duration} min<br />Due in {index + 1} days</div>
                  <MoreVertical size={18} />
                </div>
              );
            })}
            {liveQuizzes.length === 0 ? <p className="muted">No live quizzes yet. Publish a draft to make it available to students.</p> : null}
            <Link className="btn full" href="/quiz/javascript-basics/instructions" style={{ marginTop: 14 }}>
              View student quiz flow
            </Link>
          </section>
        </div> : null}

        {summary ? <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 300px" }}>
          <section className="card" id="quizzes">
            <div className="section-head" style={{ padding: "18px 20px 0" }}>
              <h3>Recent Quizzes</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="input" placeholder="Search coming soon" disabled />
                <select className="select" disabled><option>All Classes</option></select>
                <select className="select" disabled><option>All Status</option></select>
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz Name</th>
                  <th>Class</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td><strong>{quiz.name}</strong></td>
                    <td>{quiz.className}</td>
                    <td>{quiz.questions}</td>
                    <td>{quiz.duration} min</td>
                    <td><Badge tone={quizStatusTone(quiz.status)}>{quizStatusLabel(quiz.status)}</Badge></td>
                    <td>{quiz.created}</td>
                    <td><Link className="linkish" href={`/professor/quizzes/${quiz.id}/edit`}>Edit</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="card pad">
            <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
            {quickActions.map((action, index) => {
              const icons = [Plus, Upload, Library, Wand2];
              const Icon = icons[index];
              const href = index === 0 ? "/professor/create-quiz" : index === 2 ? "/professor/question-bank" : index === 3 ? "/professor/create-quiz?ai=open" : "/professor/templates";
              return (
                <Link className="nav-link" href={href} key={action}>
                  <Icon size={17} />
                  {action}
                </Link>
              );
            })}
            <div className="soft-panel" style={{ padding: 18, marginTop: 18 }}>
              <strong>Save time!</strong>
              <p className="muted small">Use templates or AI-assisted outlines to generate questions quickly.</p>
              <Link className="btn ghost" href="/professor/create-quiz?ai=open">Try AI Generator</Link>
            </div>
          </aside>
        </div> : null}
      </div>
    </AppShell>
  );
}
