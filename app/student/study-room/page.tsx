"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Clock3, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, SkeletonCard } from "@/components/ui";
import { studentApi } from "@/lib/apiClient";

export default function StudyRoomPage() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    studentApi.studyRoom().then(setData).catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Study room failed to load."));
  }, []);

  const suggestedTopic = data?.weakTopicCards?.[0]?.topic ?? "JavaScript Basics";
  const flashcards = [
    ...(data?.missedQuestions ?? []).map((question: any) => ({
      id: question.id,
      front: question.text,
      back: question.explanation || `Review ${question.topic}, then retry a short practice loop.`,
      topic: question.topic
    })),
    ...(data?.weakTopicCards ?? []).map((topic: any) => ({
      id: `topic-${topic.topic}`,
      front: `What should you revise in ${topic.topic}?`,
      back: `${topic.recommendedQuestionCount} ${topic.difficulty.toLowerCase()} practice questions are recommended for ${topic.subject}.`,
      topic: topic.topic
    }))
  ].slice(0, 6);

  return (
    <AppShell title="Study Room" subtitle="Practice smarter with revision prompts, weak-topic focus, and spaced review.">
      <div className="content grid">
        {error ? <div className="notice">{error}</div> : null}
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <>
            <section className="ai-panel">
              <div className="grid">
                <div className="badge purple"><Sparkles size={14} /> AI Study Suggestion</div>
                <div>
                  <h2>Study what matters most next.</h2>
                  <p className="muted">{data.aiSuggestion}</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn primary" href={`/student/practice?topic=${encodeURIComponent(suggestedTopic)}`}>Start Practice</Link>
                  {data.latestAttemptId ? <Link className="btn" href={`/attempts/${data.latestAttemptId}/review`}>Review missed answers</Link> : null}
                </div>
              </div>
              <div className="insight-list">
                {(data.weakTopicCards ?? []).slice(0, 4).map((topic: any) => (
                  <div className="insight-item" key={topic.topic}>
                    <span className="muted">{topic.topic}</span>
                    <strong>{topic.weakScore}% weak score</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="card pad">
              <div className="section-head">
                <h3>Weak Topic Practice</h3>
                <Link className="linkish" href="/student/dashboard">Back to dashboard</Link>
              </div>
              {data.weakTopicCards?.length ? (
                <div className="grid grid-3">
                  {data.weakTopicCards.map((topic: any) => (
                    <div className="card pad" key={topic.topic}>
                      <div className="icon-tile"><BrainCircuit size={24} /></div>
                      <h3>{topic.topic}</h3>
                      <p className="muted">{topic.subject}</p>
                      <p className="small">Weak score: <strong>{topic.weakScore}%</strong></p>
                      <p className="small">{topic.recommendedQuestionCount} recommended questions - {topic.difficulty}</p>
                      <Link className="btn primary full" href={`/student/practice?topic=${encodeURIComponent(topic.topic)}`}>Start Practice</Link>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No weak topics yet" text="Complete another quiz and your focused study cards will appear here." />
              )}
            </section>

            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h3>Missed Questions Review</h3>
                  {data.latestAttemptId ? <Link className="linkish" href={`/attempts/${data.latestAttemptId}/review`}>Full review</Link> : null}
                </div>
                {data.missedQuestions?.length ? data.missedQuestions.map((question: any) => (
                  <div className="soft-panel pad-sm" key={question.id} style={{ marginBottom: 12 }}>
                    <strong>{question.text}</strong>
                    <p className="muted small">{question.topic} - {question.status}</p>
                    <Link className="linkish" href={`/student/practice?topic=${encodeURIComponent(question.topic)}`}>Review</Link>
                  </div>
                )) : <EmptyState title="Nothing missed recently" text="Great work. Your missed-question review list will appear after a submitted quiz." />}
              </section>

              <section className="card pad">
                <h3>Flashcards / Spaced Revision</h3>
                {flashcards.length ? (
                  <div className="grid">
                    {flashcards.map((card: any) => {
                      const flipped = !!flippedCards[card.id];
                      return (
                        <button
                          className="soft-panel pad-sm"
                          key={card.id}
                          onClick={() => setFlippedCards((current) => ({ ...current, [card.id]: !current[card.id] }))}
                          style={{ minHeight: 120, textAlign: "left", cursor: "pointer" }}
                          type="button"
                        >
                          <Clock3 size={22} />
                          <p className="muted small">{card.topic}</p>
                          <strong>{flipped ? card.back : card.front}</strong>
                          <p className="muted small">{flipped ? "Click to show prompt" : "Click to reveal revision note"}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="soft-panel pad-sm" style={{ minHeight: 140 }}>
                    <Clock3 size={22} />
                    <p className="muted">Complete a quiz to generate spaced revision flashcards from missed questions and weak topics.</p>
                  </div>
                )}
                <div style={{ marginTop: 18 }}>
                  <Link className="btn primary full" href={`/student/practice?topic=${encodeURIComponent(suggestedTopic)}`}>Generate Practice Quiz</Link>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
