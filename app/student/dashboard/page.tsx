"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Flame, PlayCircle, Sparkles, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard, StatCard } from "@/components/ui";
import { studentApi } from "@/lib/apiClient";

const statIcons = {
  "Active Quizzes": PlayCircle,
  Completed: Trophy,
  XP: Flame,
  Level: BrainCircuit
};

export default function StudentDashboardPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    studentApi.dashboard()
      .then(setData)
      .catch(() => setData({ latestQuizzes: [], badges: [], classes: [], completedHistory: [], latestLearning: null }));
  }, []);

  const recommendedTopic = data?.latestLearning?.weakTopics?.[0]?.topic
    ?? data?.latestLearning?.practiceRecommendations?.[0]?.topic
    ?? data?.weakTopics?.[0]
    ?? data?.latestQuizzes?.[0]?.topic
    ?? "JavaScript Basics";

  return (
    <AppShell title="Dashboard" subtitle="Stay on top of quizzes, progress, and what to study next.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}</div>
        ) : (
          <>
            <div className="section-head">
              <div>
                <h2>Welcome back, {data.studentName}!</h2>
                <p className="muted">Your next learning step is ready as soon as you are.</p>
              </div>
              <Badge tone="green">Level {data.level}</Badge>
            </div>
            <div className="grid grid-4">
              {[
                { label: "Active Quizzes", value: String(data.activeQuizCount), hint: "Ready to take", tone: "purple" },
                { label: "Completed", value: String(data.completedQuizCount), hint: "Finished attempts", tone: "green" },
                { label: "XP", value: String(data.xp), hint: "Earned so far", tone: "amber" },
                { label: "Level", value: String(data.level), hint: "Current rank", tone: "blue" }
              ].map((stat) => (
                <StatCard key={stat.label} {...stat} icon={statIcons[stat.label as keyof typeof statIcons]} />
              ))}
            </div>

            <section className="ai-panel">
              <div className="grid">
                <Badge tone="purple"><Sparkles size={14} /> Continue Learning</Badge>
                <div>
                  <h2>Pick up exactly where your latest quiz left off.</h2>
                  <p className="muted">{data.aiSuggestion}</p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn primary" href={`/student/practice?topic=${encodeURIComponent(recommendedTopic)}`}>Recommended Practice</Link>
                  <Link className="btn" href="/student/study-room">Go to Study Room</Link>
                  {data.latestLearning?.attemptId ? <Link className="btn ghost" href={`/attempts/${data.latestLearning.attemptId}/review`}>Review Latest Answers</Link> : null}
                </div>
              </div>
              <div className="insight-list">
                <div className="insight-item"><span className="muted">Weak topics</span><strong>{data.weakTopics?.join(", ") || "No major weak topics yet"}</strong></div>
                <div className="insight-item"><span className="muted">Average accuracy</span><strong>{data.averageAccuracy}%</strong></div>
                <div className="insight-item"><span className="muted">Latest result</span><strong>{data.latestLearning ? `${Math.round(data.latestLearning.percentage)}% on ${data.latestLearning.quizTitle}` : "Take a quiz to generate this"}</strong></div>
                <div className="insight-item"><span className="muted">Badges unlocked</span><strong>{data.badges?.filter((badge: any) => badge.unlocked).length ?? 0}</strong></div>
              </div>
            </section>

            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h3>Latest Result</h3>
                  {data.latestLearning?.attemptId ? <Link className="linkish" href={`/quiz/${data.latestLearning.quizId}/results?attemptId=${data.latestLearning.attemptId}`}>Open result</Link> : null}
                </div>
                {data.latestLearning ? (
                  <div className="grid">
                    <div className="soft-panel pad-sm">
                      <strong>{data.latestLearning.quizTitle}</strong>
                      <p className="muted small">{Math.round(data.latestLearning.score)} / {data.latestLearning.totalMarks} marks - {Math.round(data.latestLearning.percentage)}%</p>
                    </div>
                    <div className="grid grid-2">
                      <div className="card pad"><strong>{data.latestLearning.correctCount}</strong><br /><span className="muted small">Correct</span></div>
                      <div className="card pad"><strong>{data.latestLearning.incorrectCount + data.latestLearning.unansweredCount}</strong><br /><span className="muted small">Needs review</span></div>
                    </div>
                    <div className="soft-panel pad-sm">
                      <strong>Next recommended step</strong>
                      <p className="muted small">{data.latestLearning.feedback.recommendedPracticeSet}</p>
                    </div>
                  </div>
                ) : (
                  <p className="muted">Complete a quiz to unlock your detailed learning summary.</p>
                )}
              </section>

              <section className="card pad">
                <div className="section-head">
                  <h3>Badge Preview</h3>
                  <Link className="linkish" href="/student/achievements">See all</Link>
                </div>
                <div className="grid">
                  {data.badges.slice(0, 4).map((badge: any) => (
                    <div className="achievement-card" key={badge.name}>
                      <strong>{badge.name}</strong>
                      <p className="muted small">{badge.unlocked ? "Unlocked" : badge.criteria}</p>
                      <div className="progress-line"><span style={{ width: `${badge.progress}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h3>Active Quizzes</h3>
                  <Link className="linkish" href="/student/classroom">View all</Link>
                </div>
                <div className="grid">
                  {data.latestQuizzes.length ? data.latestQuizzes.map((quiz: any) => (
                    <div className="soft-panel pad-sm" key={quiz.id}>
                      <strong>{quiz.title}</strong>
                      <p className="muted small">{quiz.className} - {quiz.questions} questions - {quiz.duration} min</p>
                      <Link className="btn full" href={`/quiz/${quiz.id}/instructions`}>Open Quiz</Link>
                    </div>
                  )) : <p className="muted">No active quizzes yet. Ask your professor to publish one to begin.</p>}
                </div>
              </section>

              <section className="card pad">
                <div className="section-head">
                  <h3>Completed Quizzes</h3>
                  <Link className="linkish" href="/student/study-room">Continue learning</Link>
                </div>
                <div className="grid">
                  {data.completedHistory.length ? data.completedHistory.map((attempt: any) => (
                    <div className="row-item" key={attempt.id}>
                      <div>
                        <strong>{attempt.title}</strong>
                        <div className="muted small">{attempt.topic} - {attempt.percentage}%</div>
                      </div>
                      <span className="spacer" />
                      <Link className="linkish" href={`/quiz/${paramsSafeQuizId(attempt)}/results?attemptId=${attempt.id}`}>View</Link>
                    </div>
                  )) : <p className="muted">Your submitted quiz history will appear here after your first completion.</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function paramsSafeQuizId(attempt: { quizId?: string; id?: string }) {
  return attempt.quizId ?? "javascript-basics";
}
