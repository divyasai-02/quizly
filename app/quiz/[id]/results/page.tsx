"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, ClipboardCheck, Home, Star, Trophy, XCircle } from "lucide-react";
import { Badge, ProgressRing, SkeletonCard } from "@/components/ui";
import { attemptApi } from "@/lib/apiClient";

export default function ResultsPage() {
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
          {error ? <div className="notice">{error}</div> : <SkeletonCard lines={6} />}
        </section>
      </main>
    );
  }

  const minutes = Math.floor((result.timeTakenSeconds ?? 0) / 60);
  const seconds = String((result.timeTakenSeconds ?? 0) % 60).padStart(2, "0");
  const weakTopics = result.feedback?.weakTopics ?? result.weakTopics ?? [];
  const strongTopics = result.feedback?.strongTopics ?? result.strongTopics ?? [];
  const nextSteps = result.feedback?.nextSteps ?? [
    "Review every incorrect question explanation.",
    "Redo a short practice set on the weakest topic.",
    "Summarize the rule behind each missed answer."
  ];

  return (
    <main className="quiz-frame">
      <section className="card pad" style={{ textAlign: "center" }}>
        <Trophy size={64} color="var(--amber)" fill="currentColor" />
        <h1>Great Job!</h1>
        <p className="muted">You have completed the quiz.</p>
        <div className="card pad" style={{ maxWidth: 560, margin: "24px auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 34, flexWrap: "wrap" }}>
            <ProgressRing value={result.percentage} label={String(result.score)} total={result.totalMarks} />
            <div style={{ textAlign: "left" }}>
              <span className="muted">Your Score</span>
              <h2>{result.score} / {result.totalMarks}</h2>
              <strong style={{ color: "var(--green)", fontSize: 26 }}>{Math.round(result.percentage)}%</strong>
              <p><span className={`badge ${result.passed ? "green" : "pink"}`}><CheckCircle2 size={14} />{result.passed ? "Passed" : "Failed"}</span></p>
            </div>
          </div>
          <div className="grid grid-4" style={{ marginTop: 24 }}>
            <div className="card pad"><ClipboardCheck color="var(--purple)" /><h2>{result.correct}</h2><span className="muted">Correct</span></div>
            <div className="card pad"><XCircle color="var(--pink)" /><h2>{result.incorrect}</h2><span className="muted">Incorrect</span></div>
            <div className="card pad"><Clock color="var(--muted)" /><h2>{minutes}:{seconds}</h2><span className="muted">Time Taken</span></div>
            <div className="card pad"><Star color="var(--amber)" /><h2>+{result.marksObtained}</h2><span className="muted">Marks</span></div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 24 }}>
            <Link className="btn full" href="/quiz/javascript-basics/take"><ClipboardCheck size={17} />Review Answers</Link>
            <Link className="btn primary full" href="/dashboard"><Home size={17} />Back to Dashboard</Link>
          </div>
        </div>
        <section className="card pad" style={{ maxWidth: 560, margin: "0 auto", textAlign: "left" }}>
          <Badge tone="purple">AI Feedback</Badge>
          <h3>Personal Revision Plan</h3>
          <p>{result.feedback?.feedback ?? "Your AI feedback will appear after submission."}</p>
          <div className="grid grid-2">
            <div className="soft-panel" style={{ padding: 14 }}>
              <strong>Strong topics</strong>
              <p className="muted small">{strongTopics.length ? strongTopics.join(", ") : "Build confidence by reviewing the questions you answered correctly."}</p>
            </div>
            <div className="soft-panel" style={{ padding: 14 }}>
              <strong>Weak topics</strong>
              <p className="muted small">{weakTopics.length ? weakTopics.join(", ") : "Focus on the concepts behind missed or skipped questions."}</p>
            </div>
          </div>
          <h4>Recommended revision steps</h4>
          <ol>
            {nextSteps.slice(0, 3).map((step: string) => <li key={step}>{step}</li>)}
          </ol>
          <div className="notice"><strong>Practice action:</strong> {result.feedback?.practiceAction ?? "Take one short revision quiz on the weakest topic before attempting the next assessment."}</div>
          {result.missedQuestions?.length ? (
            <div className="grid" style={{ marginTop: 18 }}>
              <h4>Missed questions to review</h4>
              {result.missedQuestions.map((item: any) => (
                <div className="card pad" key={item.id}>
                  <strong>{item.text}</strong>
                  <p className="muted small">{item.explanation || "Review the related concept and compare your selected answer with the correct option."}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
