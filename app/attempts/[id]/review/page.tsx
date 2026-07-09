"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { attemptApi } from "@/lib/apiClient";

export default function AttemptReviewPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");

  useEffect(() => {
    attemptApi.review(params.id)
      .then(setData)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Review failed to load."));
  }, [params.id]);

  const topics = useMemo(() => {
    const values = ((data?.reviewQuestions ?? []) as Array<{ topic?: string }>).map((question) => String(question.topic ?? "General"));
    return ["All", ...Array.from(new Set<string>(values))];
  }, [data]);
  const filteredQuestions = useMemo(() => {
    return (data?.reviewQuestions ?? []).filter((question: any) => {
      if (statusFilter === "Incorrect only" && question.status !== "Incorrect") return false;
      if (statusFilter === "Correct only" && question.status !== "Correct") return false;
      if (statusFilter === "Marked for review" && !question.markedForReview) return false;
      if (topicFilter !== "All" && question.topic !== topicFilter) return false;
      return true;
    });
  }, [data, statusFilter, topicFilter]);

  if (!data) {
    return (
      <main className="quiz-frame">
        <section className="card pad">
          {error ? <div className="notice">{error}</div> : <SkeletonCard lines={8} />}
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-frame">
      <section className="grid">
        <div className="card pad">
          <div className="section-head">
            <div>
              <h1 style={{ margin: 0 }}>{data.quizTitle}</h1>
              <p className="muted">Review every answer, understand mistakes, and jump into targeted practice.</p>
            </div>
            <Badge tone={data.passed ? "green" : "pink"}>{data.passed ? "Passed" : "Needs review"}</Badge>
          </div>
          <div className="grid grid-4">
            <div className="card pad"><strong>{data.score} / {data.totalMarks}</strong><br /><span className="muted small">Score</span></div>
            <div className="card pad"><strong>{data.correctCount}</strong><br /><span className="muted small">Correct</span></div>
            <div className="card pad"><strong>{data.incorrectCount}</strong><br /><span className="muted small">Incorrect</span></div>
            <div className="card pad"><strong>{data.unansweredCount}</strong><br /><span className="muted small">Unanswered</span></div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <Badge tone="amber">Time taken: {Math.floor(data.timeTakenSeconds / 60)}:{String(data.timeTakenSeconds % 60).padStart(2, "0")}</Badge>
            <Badge tone="blue">Class average: {data.classAverage}%</Badge>
            <Badge tone="purple">Mock percentile: {data.percentile}%</Badge>
          </div>
        </div>

        <div className="card pad">
          <div className="toolbar-inline">
            <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Incorrect only</option>
              <option>Correct only</option>
              <option>Marked for review</option>
            </select>
            <select className="select" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </select>
            <Link className="btn" href={`/student/practice?topic=${encodeURIComponent(data.weakTopics[0]?.topic ?? data.topic)}`}>Practice weak topic</Link>
          </div>
        </div>

        {!filteredQuestions.length ? (
          <EmptyState title="No questions match this filter" text="Try switching the review filter or topic to see more answers." />
        ) : (
          <div className="grid">
            {filteredQuestions.map((question: any, index: number) => (
              <article className="card pad" key={question.id}>
                <div className="section-head">
                  <div>
                    <strong>{index + 1}. {question.text}</strong>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      <Badge tone={question.status === "Correct" ? "green" : question.status === "Incorrect" ? "pink" : "amber"}>{question.status}</Badge>
                      <Badge tone="blue">{question.topic}</Badge>
                      <Badge tone={question.difficulty === "Easy" ? "green" : question.difficulty === "Hard" ? "pink" : "amber"}>{question.difficulty}</Badge>
                      {question.markedForReview ? <Badge tone="amber">Marked for review</Badge> : null}
                    </div>
                  </div>
                  <strong>{question.marksAwarded} / {question.totalMarks}</strong>
                </div>

                <div className="grid">
                  {question.options.length ? question.options.map((option: any) => (
                    <div className="row-item" key={option.id} style={{ padding: 12, background: option.correct ? "#eefcf4" : option.incorrectSelected ? "#fff1f6" : undefined }}>
                      <span>{option.text}</span>
                      <span className="spacer" />
                      {option.selected ? <Badge tone={option.correct ? "green" : "pink"}>{option.correct ? "Selected" : "Selected incorrectly"}</Badge> : null}
                      {option.correct ? <Badge tone="green">Correct answer</Badge> : null}
                    </div>
                  )) : (
                    <div className="grid grid-2">
                      <div className="soft-panel pad-sm">
                        <strong>Your answer</strong>
                        <p className="muted small">{question.selectedAnswerText || "No answer submitted."}</p>
                      </div>
                      <div className="soft-panel pad-sm">
                        <strong>Expected answer</strong>
                        <p className="muted small">{question.correctAnswer.join(", ")}</p>
                        <Badge tone="amber">AI/manual review placeholder</Badge>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-2">
                    <div className="soft-panel pad-sm">
                      <strong>Your selection</strong>
                      <p className="muted small">{question.selectedAnswer.length ? question.selectedAnswer.join(", ") : question.selectedAnswerText || "Unanswered"}</p>
                    </div>
                    <div className="soft-panel pad-sm">
                      <strong>Correct answer</strong>
                      <p className="muted small">{question.correctAnswer.join(", ")}</p>
                    </div>
                  </div>

                  <div className="soft-panel pad-sm">
                    <strong>Explanation</strong>
                    <p className="muted small">{question.explanation}</p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn" href={`/student/practice?topic=${encodeURIComponent(question.practiceTopic)}`}>Practice similar</Link>
                    <Link className="btn ghost" href={`/quiz/${data.quizId}/results?attemptId=${data.attemptId}`}>Back to results</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
