"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Eye, PencilLine, Rocket, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { quizApi } from "@/lib/apiClient";
import { quizStatusTone } from "@/lib/status";

const tabs = ["All", "Draft", "Live", "Closed"] as const;

export default function ProfessorQuizzesPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");

  function loadQuizzes() {
    quizApi.list().then(setRows).catch(() => setRows([]));
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  const filtered = useMemo(() => {
    return (rows ?? []).filter((quiz) => {
      if (activeTab !== "All" && quiz.status !== activeTab) return false;
      const query = search.trim().toLowerCase();
      if (query && ![quiz.title, quiz.subject, quiz.className].some((value) => String(value).toLowerCase().includes(query))) return false;
      return true;
    });
  }, [activeTab, rows, search]);

  async function publish(id: string) {
    await quizApi.publish(id);
    loadQuizzes();
  }

  async function closeQuiz(id: string) {
    await quizApi.close(id);
    loadQuizzes();
  }

  async function deleteQuiz(id: string) {
    if (!window.confirm("Delete this quiz?")) return;
    await quizApi.remove(id);
    loadQuizzes();
  }

  return (
    <AppShell title="Quizzes" subtitle="Manage draft, published, and closed quizzes from one professor workspace.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>All Quizzes</h2>
            <p className="muted">Filter by status, search by title/subject/class, and take the next authoring action quickly.</p>
          </div>
          <Link className="btn primary" href="/professor/create-quiz">Create Quiz</Link>
        </div>

        <section className="card pad">
          <div className="toolbar-inline">
            {tabs.map((tab) => (
              <button key={tab} className={`btn ${activeTab === tab ? "primary" : ""}`} onClick={() => setActiveTab(tab)} type="button">{tab}</button>
            ))}
            <label className="search search-inline">
              <Search size={18} />
              <input placeholder="Search by title, subject, or class" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        </section>

        {!rows ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : filtered.length ? (
          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((quiz) => (
                  <tr key={quiz.id}>
                    <td><strong>{quiz.title}</strong></td>
                    <td>{quiz.subject}</td>
                    <td>{quiz.className}</td>
                    <td>{quiz.questions}</td>
                    <td><Badge tone={quizStatusTone(quiz.status)}>{quiz.status}</Badge></td>
                    <td>{quiz.created}</td>
                    <td>
                      <div className="table-actions">
                        {quiz.status === "Draft" ? <Link className="linkish" href={`/professor/quizzes/${quiz.id}/edit`}><PencilLine size={15} />Edit</Link> : null}
                        <Link className="linkish" href={`/quiz/${quiz.id}/instructions`}><Eye size={15} />Preview</Link>
                        <button className="linkish" disabled type="button"><Copy size={15} />Duplicate</button>
                        {quiz.status === "Draft" ? <button className="linkish" onClick={() => publish(quiz.id)} type="button"><Rocket size={15} />Publish</button> : null}
                        {quiz.status === "Live" ? <button className="linkish" onClick={() => closeQuiz(quiz.id)} type="button"><Rocket size={15} />Close</button> : null}
                        <button className="linkish" onClick={() => deleteQuiz(quiz.id)} type="button"><Trash2 size={15} />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <div className="card pad">
            <strong>No quizzes match this view.</strong>
            <p className="muted">Try a different status tab or search term, or create a new draft quiz to get started.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
