"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Expand, ListChecks, PlayCircle, Star, Trophy } from "lucide-react";
import { SkeletonBlock, SkeletonCard } from "@/components/ui";
import { quizApi } from "@/lib/apiClient";

export default function InstructionsPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/session/current", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setRole(payload.user?.roleKey ?? null))
      .catch(() => setRole(null));

    quizApi.instructions(params.id)
      .then((data) => setQuiz({
        title: data.title,
        subject: data.subject,
        description: data.description,
        questions: data.questionsList?.length ?? data.questions,
        duration: data.duration,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        instructions: data.instructions
      }))
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Quiz instructions failed to load."));
  }, [params.id]);

  return (
    <main className="quiz-frame">
      <section className="card" style={{ overflow: "hidden" }}>
        <div className="student-top">
          <Link className="icon-button" href="/dashboard"><ArrowLeft size={20} /></Link>
          <strong className="brand" style={{ fontSize: 24, margin: "0 auto" }}>Quizly</strong>
          <button className="icon-button" aria-label="Fullscreen"><Expand size={20} /></button>
        </div>
        {!quiz ? (
          <div style={{ padding: 28 }} className="grid">
            {error ? <div className="notice">{error}</div> : null}
            <SkeletonBlock height={34} width="55%" />
            <SkeletonBlock height={14} width="34%" />
            <div className="grid grid-4">
              {Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={2} />)}
            </div>
            <SkeletonCard lines={5} />
          </div>
        ) : <div style={{ padding: 28 }} className="grid">
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div className="icon-tile"><BookOpen size={30} /></div>
            <div>
              <h1>{quiz.title}</h1>
              <p className="muted">{quiz.subject}</p>
            </div>
          </div>
          <p>{quiz.description}</p>
          <div className="metric-strip">
            <div className="metric"><ListChecks color="var(--purple)" /><strong>{quiz.questions}</strong><br /><span className="muted small">Questions</span></div>
            <div className="metric"><Clock color="var(--purple)" /><strong>{quiz.duration} min</strong><br /><span className="muted small">Time Limit</span></div>
            <div className="metric"><Star color="var(--amber)" /><strong>{quiz.totalMarks}</strong><br /><span className="muted small">Total Marks</span></div>
            <div className="metric"><Trophy color="var(--purple)" /><strong>Passing</strong><br /><span className="muted small">{quiz.passingMarks} Marks</span></div>
          </div>
          <h2>Instructions</h2>
          {quiz.instructions.map((item: string) => (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }} key={item}><CheckCircle2 size={18} color="var(--purple)" /><span>{item}</span></div>
          ))}
          <div className="soft-panel" style={{ padding: 18 }}><strong>Tip:</strong> <span className="muted">You can review and change your answers before final submission.</span></div>
          {role === "student" ? (
            <Link className="btn primary full" href={`/quiz/${params.id}/take`}><PlayCircle size={19} />Start Quiz</Link>
          ) : (
            <div className="grid">
              <div className="notice">Quiz taking is available to student accounts.</div>
              <Link className="btn full" href="/dashboard">Back to Dashboard</Link>
            </div>
          )}
        </div>}
      </section>
    </main>
  );
}
