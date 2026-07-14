"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Clock, MoreVertical, Trash2 } from "lucide-react";
import { SkeletonCard } from "@/components/ui";
import { attemptApi, quizApi } from "@/lib/apiClient";

export default function TakeQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | undefined>>({});
  const [review, setReview] = useState<Record<number, boolean>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [quizTitle, setQuizTitle] = useState("Loading quiz...");
  const [questions, setQuestions] = useState<any[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timerReady, setTimerReady] = useState(false);
  const question = questions?.[current];
  const selected = answers[current];
  const answeredCount = questions ? questions.filter((_, index) => answers[index] !== undefined).length : 0;
  const markedCount = Object.values(review).filter(Boolean).length;
  const unansweredCount = Math.max(0, (questions?.length ?? 0) - answeredCount);

  useEffect(() => {
    const handle = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(handle);
  }, []);

  const answerPayload = useMemo(() => {
    if (!questions) return [];
    return questions.map((item, index) => {
      const selectedIndex = answers[index];
      const optionIds = "optionIds" in item && Array.isArray(item.optionIds) ? item.optionIds : [];
      return {
        questionId: String(item.id),
        selectedOptionIds: selectedIndex === undefined ? [] : [optionIds[selectedIndex]].filter(Boolean),
        markedForReview: !!review[index]
      };
    });
  }, [answers, questions, review]);

  const submitQuiz = useCallback(async (autoSubmitted = false) => {
    if (!attemptId) {
      router.push(`/quiz/${params.id}/results`);
      return;
    }
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      await attemptApi.submit(attemptId, answerPayload, autoSubmitted);
      window.localStorage.setItem("quizly-attempt-id", attemptId);
      router.push(`/quiz/${params.id}/results?attemptId=${attemptId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Submission failed.";
      if (message.toLowerCase().includes("already")) {
        setSubmitMessage("This attempt was already submitted. Taking you to results.");
        window.localStorage.setItem("quizly-attempt-id", attemptId);
        router.push(`/quiz/${params.id}/results?attemptId=${attemptId}`);
        return;
      }
      setSubmitMessage(message);
      setSubmitting(false);
    }
  }, [answerPayload, attemptId, params.id, router]);

  useEffect(() => {
    Promise.all([quizApi.instructions(params.id), attemptApi.start(params.id)])
      .then(([quiz, attempt]) => {
        setQuizTitle(quiz.title);
        setQuestions(quiz.questionsList?.length ? quiz.questionsList : []);
        setSeconds((quiz.duration ?? 15) * 60);
        setAttemptId(attempt.id);
        setTimerReady(true);
        window.localStorage.setItem("quizly-attempt-id", attempt.id);
      })
      .catch((error) => {
        const stored = window.localStorage.getItem("quizly-attempt");
        if (stored) {
          const parsed = JSON.parse(stored);
          setAnswers(parsed.answers ?? {});
          setReview(parsed.review ?? {});
        }
        setLoadError(error instanceof Error ? error.message : "Quiz failed to load.");
        setTimerReady(false);
      });
  }, [params.id]);

  useEffect(() => {
    window.localStorage.setItem("quizly-attempt", JSON.stringify({ answers, review }));
    if (!attemptId) return;
    const handle = window.setTimeout(() => {
      attemptApi.saveAnswers(attemptId, answerPayload).catch(() => undefined);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [answers, review, attemptId, answerPayload]);

  useEffect(() => {
    if (timerReady && seconds === 0) {
      submitQuiz(true);
    }
  }, [seconds, submitQuiz, timerReady]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <main className="quiz-frame">
      <section className="card" style={{ overflow: "hidden" }}>
        <div className="student-top">
          <Link className="icon-button" href={`/quiz/${params.id}/instructions`}><ArrowLeft size={20} /></Link>
          <strong>{quizTitle}</strong>
          <span className="spacer" />
          <Clock size={18} color="var(--pink)" /><strong style={{ color: "var(--pink)" }}>{mm}:{ss}</strong>
          <MoreVertical />
        </div>
        {!questions || !question ? (
          <div style={{ padding: 28 }} className="grid">
            {loadError ? <div className="notice">{loadError}</div> : null}
            <SkeletonCard lines={5} />
          </div>
        ) : <div className="take-layout" style={{ padding: 28 }}>
          <div className="grid">
            <span className="muted">Question {current + 1} of {questions.length}</span>
            <div className="progress-line"><span style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
            <section className="card pad">
              <h2>{question.text}</h2>
              <div className="grid">
                {question.options.map((option: string, index: number) => (
                  <button className={`answer-option ${selected === index ? "selected" : ""}`} key={option} onClick={() => setAnswers((items) => ({ ...items, [current]: index }))}>
                    <span className="radio-dot" style={selected === index ? { border: "5px solid var(--purple)" } : undefined} />
                    {option}
                  </button>
                ))}
              </div>
              <div className="section-head" style={{ marginTop: 18 }}>
                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={!!review[current]} onChange={() => setReview((items) => ({ ...items, [current]: !items[current] }))} />
                  Mark for review
                </label>
                <Bookmark color={review[current] ? "var(--purple)" : "var(--muted)"} />
              </div>
            </section>
          </div>
          <aside className="card pad">
            <h3>Question Navigator</h3>
            <p className="small"><span className="badge green"> </span> Answered</p>
            <p className="small"><span className="badge"> </span> Not Answered</p>
            <p className="small"><span className="badge amber"> </span> Marked for Review</p>
            <div className="nav-grid">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`nav-cell ${answers[index] !== undefined ? "answered" : ""} ${review[index] ? "review" : ""} ${current === index ? "current" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <button className="btn full" style={{ marginTop: 18 }} onClick={() => setReview((items) => ({ ...items, [current]: true }))}><Bookmark size={17} />Review Later</button>
          </aside>
        </div>}
        <div className="student-top">
          <button className="btn" disabled={current === 0} onClick={() => setCurrent(Math.max(0, current - 1))}>Previous</button>
          <span className="spacer" />
          <button className="linkish" disabled={!questions} onClick={() => setAnswers((items) => ({ ...items, [current]: undefined }))}><Trash2 size={16} /> Clear Answer</button>
          <span className="spacer" />
          {questions && current === questions.length - 1 ? (
            <button className="btn primary" onClick={() => setShowConfirm(true)}>Submit Quiz</button>
          ) : (
            <button className="btn primary" disabled={!questions} onClick={() => setCurrent(Math.min((questions?.length ?? 1) - 1, current + 1))}>Next</button>
          )}
        </div>
        {submitMessage ? <div className="notice" style={{ margin: 18 }}>{submitMessage}</div> : null}
        {showConfirm ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="submit-title">
            <div className="modal-card pad grid">
              <h2 id="submit-title">Submit quiz?</h2>
              <p className="muted">Review your attempt summary before final submission.</p>
              <div className="grid grid-3">
                <div className="card pad"><strong>{answeredCount}</strong><br /><span className="muted small">Answered</span></div>
                <div className="card pad"><strong>{unansweredCount}</strong><br /><span className="muted small">Unanswered</span></div>
                <div className="card pad"><strong>{markedCount}</strong><br /><span className="muted small">Marked</span></div>
              </div>
              {unansweredCount > 0 ? <div className="notice">You still have {unansweredCount} unanswered question{unansweredCount === 1 ? "" : "s"}. You can submit anyway or go back.</div> : null}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => setShowConfirm(false)} disabled={submitting}>Cancel</button>
                <button className="btn primary" onClick={() => submitQuiz(false)} disabled={submitting}>{submitting ? "Submitting..." : "Submit anyway"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
