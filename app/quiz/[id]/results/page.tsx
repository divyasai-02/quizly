"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Award, BrainCircuit, CheckCircle2, Clock, Home, Sparkles, Star, Trophy, XCircle } from "lucide-react";
import { Badge, ProgressRing, SkeletonCard } from "@/components/ui";
import { attemptApi } from "@/lib/apiClient";

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const attemptId = searchParams.get("attemptId") ?? window.localStorage.getItem("quizly-attempt-id");
    if (!attemptId) return;
    attemptApi.results(attemptId).then(setResult).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Results failed to load."));
  }, [searchParams]);

  if (!result) {
    return (
      <main className="quiz-frame">
        <section className="card pad">
          {error ? <div className="notice">{error}</div> : <SkeletonCard lines={8} />}
        </section>
      </main>
    );
  }

  const minutes = Math.floor((result.timeTakenSeconds ?? 0) / 60);
  const seconds = String((result.timeTakenSeconds ?? 0) % 60).padStart(2, "0");
  const weakTopics = result.feedback?.weakTopics ?? [];
  const strongTopics = result.feedback?.strongTopics ?? [];
  const nextSteps = result.feedback?.nextSteps ?? [];

  return (
    <main className="quiz-frame">
      <section className="grid">
        <div className="card pad" style={{ textAlign: "center" }}>
          <Trophy size={64} color="var(--amber)" fill="currentColor" />
          <h1 style={{ marginBottom: 6 }}>{result.quizTitle ?? "Quiz completed"}</h1>
          <p className="muted">You finished the attempt. Now let’s turn the result into a useful learning loop.</p>
          <div className="card pad" style={{ maxWidth: 620, margin: "24px auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
              <ProgressRing value={Math.round(result.percentage)} label={String(Math.round(result.score))} total={result.totalMarks} />
              <div style={{ textAlign: "left" }}>
                <span className="muted">Your Score</span>
                <h2>{Math.round(result.score)} / {result.totalMarks}</h2>
                <strong style={{ color: "var(--green)", fontSize: 26 }}>{Math.round(result.percentage)}%</strong>
                <p><span className={`badge ${result.passed ? "green" : "pink"}`}><CheckCircle2 size={14} />{result.passed ? "Passed" : "Needs more practice"}</span></p>
              </div>
            </div>
            <div className="grid grid-4" style={{ marginTop: 24 }}>
              <div className="card pad"><CheckCircle2 color="var(--green)" /><h2>{result.correctCount ?? result.correct}</h2><span className="muted">Correct</span></div>
              <div className="card pad"><XCircle color="var(--pink)" /><h2>{result.incorrectCount ?? result.incorrect}</h2><span className="muted">Incorrect</span></div>
              <div className="card pad"><Clock color="var(--muted)" /><h2>{minutes}:{seconds}</h2><span className="muted">Time Taken</span></div>
              <div className="card pad"><Star color="var(--amber)" /><h2>+{result.xpEarned}</h2><span className="muted">XP Earned</span></div>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
              <Link className="btn full" href={`/attempts/${result.attemptId}/review`}>Review Answers</Link>
              <Link className="btn primary full" href={`/student/practice?topic=${encodeURIComponent(result.weakTopics?.[0]?.topic ?? result.topic ?? "General")}`}>Practice Weak Topics</Link>
              <Link className="btn full" href="/student/dashboard"><Home size={17} />Back to Student Dashboard</Link>
            </div>
          </div>
        </div>

        <section className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
          <div className="card pad">
            <Badge tone="purple"><Sparkles size={14} /> AI-style Feedback</Badge>
            <h3>Personal Revision Plan</h3>
            <p>{result.feedback?.feedback}</p>
            <div className="grid grid-2">
              <div className="soft-panel pad-sm">
                <strong>Strong topics</strong>
                <p className="muted small">{strongTopics.length ? strongTopics.join(", ") : "Keep reinforcing the questions you got right."}</p>
              </div>
              <div className="soft-panel pad-sm">
                <strong>Weak topics</strong>
                <p className="muted small">{weakTopics.length ? weakTopics.join(", ") : "No major weak topics detected on this attempt."}</p>
              </div>
            </div>
            <h4>3 revision steps</h4>
            <ol>
              {nextSteps.map((step: string) => <li key={step}>{step}</li>)}
            </ol>
            <div className="notice"><strong>Recommended practice set:</strong> {result.feedback?.practiceAction}</div>
          </div>

          <div className="grid">
            <section className="card pad">
              <h3>Score Comparison</h3>
              <div className="soft-panel pad-sm">
                <strong>Class average</strong>
                <p className="muted small">{result.classAverage}% on this quiz</p>
              </div>
              <div className="soft-panel pad-sm">
                <strong>Mock percentile</strong>
                <p className="muted small">You performed better than roughly {result.percentile}% of comparable attempts.</p>
              </div>
            </section>

            <section className="card pad">
              <h3>XP Earned</h3>
              <div className="row-item" style={{ padding: 0, borderBottom: 0 }}>
                <BrainCircuit color="var(--purple)" />
                <div>
                  <strong>+{result.xpEarned} XP</strong>
                  <p className="muted small">Completion, accuracy, pass result, and pacing contributed to this reward.</p>
                </div>
              </div>
            </section>

            <section className="card pad">
              <h3>Badges</h3>
              {result.badgesUnlocked?.length ? (
                result.badgesUnlocked.map((badge: string) => (
                  <div className="row-item" key={badge} style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <Award color="var(--amber)" />
                    <div>
                      <strong>{badge}</strong>
                      <div className="muted small">Unlocked or already active on your profile.</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted small">No new badge unlocked on this attempt.</p>
              )}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}
