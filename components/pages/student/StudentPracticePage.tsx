"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { studentApi } from "@/lib/apiClient";

export function StudentPracticePage({ topic }: { topic: string }) {
  const [data, setData] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [active, setActive] = useState(0);

  useEffect(() => {
    setResult(null);
    setAnswers({});
    studentApi.practice(topic).then(setData).catch(() => setData({ topic, questions: [] }));
  }, [topic]);

  const questions = data?.questions ?? [];
  const question = questions[active];
  const selected = answers[question?.id ?? ""] ?? [];

  async function submitPractice() {
    const response = await studentApi.submitPractice(questions, Object.entries(answers).map(([questionId, selectedOptionIds]) => ({ questionId, selectedOptionIds })));
    setResult(response);
  }

  const currentResult = useMemo(() => result?.results?.find((item: any) => item.questionId === question?.id), [question?.id, result]);

  return (
    <AppShell title="Practice Mode" subtitle="Lightweight, feedback-driven practice that does not affect official quiz scores.">
      <div className="content grid">
        {!data ? (
          <SkeletonCard lines={8} />
        ) : !questions.length ? (
          <EmptyState title="No practice questions found" text="Try another topic or return after more question-bank items are added for this area." />
        ) : (
          <>
            <div className="section-head">
              <div>
                <h2>{topic} Practice</h2>
                <p className="muted">{questions.length} questions · Immediate feedback after submission · No official score impact.</p>
              </div>
              <Link className="btn" href="/student/study-room">Back to Study Room</Link>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "240px minmax(0, 1fr)" }}>
              <aside className="card pad">
                <h3>Practice Navigator</h3>
                <div className="nav-grid">
                  {questions.map((item: any, index: number) => (
                    <button key={item.id} className={`nav-cell ${answers[item.id]?.length ? "answered" : ""} ${active === index ? "current" : ""}`} onClick={() => setActive(index)} type="button">
                      {index + 1}
                    </button>
                  ))}
                </div>
              </aside>

              <section className="card pad">
                <div className="section-head">
                  <div>
                    <span className="muted">Question {active + 1} of {questions.length}</span>
                    <h3>{question.text}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone="blue">{question.topic}</Badge>
                    <Badge tone={question.difficulty === "Easy" ? "green" : question.difficulty === "Hard" ? "pink" : "amber"}>{question.difficulty}</Badge>
                  </div>
                </div>

                <div className="grid">
                  {question.options.map((option: any) => {
                    const checked = selected.includes(option.id);
                    return (
                      <label className="answer-option" key={option.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => setAnswers((current) => ({
                            ...current,
                            [question.id]: checked ? (current[question.id] ?? []).filter((value) => value !== option.id) : [...(current[question.id] ?? []), option.id]
                          }))}
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>

                {currentResult ? (
                  <div className="soft-panel pad-sm" style={{ marginTop: 18 }}>
                    <strong>{currentResult.isCorrect ? "Correct" : "Needs another try"}</strong>
                    <p className="muted small">{currentResult.explanation}</p>
                  </div>
                ) : null}

                <div className="section-head" style={{ marginTop: 18 }}>
                  <button className="btn" onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} type="button">Previous</button>
                  {active === questions.length - 1 ? (
                    <button className="btn primary" onClick={submitPractice} type="button">Finish Practice</button>
                  ) : (
                    <button className="btn primary" onClick={() => setActive(Math.min(questions.length - 1, active + 1))} type="button">Next</button>
                  )}
                </div>
              </section>
            </div>

            {result ? (
              <section className="card pad">
                <h3>Mini Result</h3>
                <div className="grid grid-4">
                  <div className="card pad"><strong>{result.correct}</strong><br /><span className="muted small">Correct</span></div>
                  <div className="card pad"><strong>{result.incorrect}</strong><br /><span className="muted small">Incorrect</span></div>
                  <div className="card pad"><strong>{result.percentage}%</strong><br /><span className="muted small">Accuracy</span></div>
                  <div className="card pad"><strong>+{result.xpEarned} XP</strong><br /><span className="muted small">Practice XP</span></div>
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
