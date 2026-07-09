"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Bot, ShieldCheck, Sparkles, TriangleAlert, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard, StatCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

const iconMap: Record<string, any> = {
  "Total Users": Users,
  Professors: Users,
  Students: Users,
  Admins: ShieldCheck,
  Classes: Users,
  Quizzes: Activity,
  Attempts: Activity,
  "AI Generations": Bot,
  "Active Quizzes": Sparkles,
  "Question Bank": Activity
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    adminApi.summary()
      .then(setData)
      .catch(() => setData({ stats: [], recentActivity: [], aiActivity: [], topSubjects: [], systemHealth: [], riskSummary: { flaggedLearners: 0, moderationNeedsReview: 0, lowEngagementClasses: 0 } }));
  }, []);

  return (
    <AppShell title="Admin Home" subtitle="Monitor platform activity, AI usage, risk signals, and seeded operational health in one place.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 10 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}</div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.stats.map((stat: any) => (
                <StatCard key={stat.label} {...stat} icon={iconMap[stat.label] ?? Activity} />
              ))}
            </div>

            <div className="grid grid-3">
              <section className="card pad">
                <div className="section-head">
                  <h2>Risk Queue</h2>
                  <Badge tone="amber"><TriangleAlert size={14} /> Needs Attention</Badge>
                </div>
                <div className="grid">
                  <div className="soft-panel pad-sm"><span className="muted small">Flagged learners</span><strong style={{ display: "block", fontSize: 26 }}>{data.riskSummary.flaggedLearners}</strong></div>
                  <div className="soft-panel pad-sm"><span className="muted small">Moderation review</span><strong style={{ display: "block", fontSize: 26 }}>{data.riskSummary.moderationNeedsReview}</strong></div>
                  <div className="soft-panel pad-sm"><span className="muted small">Low engagement classes</span><strong style={{ display: "block", fontSize: 26 }}>{data.riskSummary.lowEngagementClasses}</strong></div>
                </div>
              </section>

              <section className="card pad">
                <div className="section-head">
                  <h2>Top Subjects</h2>
                  <Badge tone="blue">Seeded Trends</Badge>
                </div>
                {(data.topSubjects ?? []).length ? (
                  <div className="grid">
                    {data.topSubjects.map((subject: any) => (
                      <div className="row-item" key={subject.subject}>
                        <div>
                          <strong>{subject.subject}</strong>
                          <div className="muted small">{subject.quizzes} quizzes</div>
                        </div>
                        <span className="spacer" />
                        <strong>{subject.attempts} attempts</strong>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState title="No subject trend data yet" text="More seeded activity will populate this panel." />}
              </section>

              <section className="card pad">
                <div className="section-head">
                  <h2>System Health</h2>
                  <Badge tone="green">Healthy</Badge>
                </div>
                <div className="grid">
                  {data.systemHealth.map((item: any) => (
                    <div className="soft-panel pad-sm" key={item.label}>
                      <div className="section-head">
                        <strong>{item.label}</strong>
                        <Badge tone={item.tone}>{item.value}</Badge>
                      </div>
                      <p className="muted small">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h2>Recent Platform Activity</h2>
                  <Badge tone="purple">Live snapshot</Badge>
                </div>
                <div className="grid">
                  {data.recentActivity.map((activity: any) => (
                    <div className="row-item" key={activity.id}>
                      <div>
                        <strong>{activity.actor}</strong>
                        <div className="muted small">{activity.text}</div>
                      </div>
                      <span className="spacer" />
                      <span className="muted small">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card pad">
                <div className="section-head">
                  <div>
                    <h2>AI Generation Activity</h2>
                    <p className="muted small">The latest AI-created records that admin teams may want to review.</p>
                  </div>
                  <Link className="btn primary" href="/admin/ai-moderation">Open Moderation</Link>
                </div>
                <div className="grid">
                  {(data.aiActivity ?? []).slice(0, 5).map((item: any) => (
                    <div className="soft-panel pad-sm" key={item.id}>
                      <div className="section-head">
                        <strong>{item.type.replaceAll("_", " ")}</strong>
                        <Badge tone={item.status === "Needs Review" ? "amber" : item.status === "Accepted" ? "green" : "blue"}>{item.status}</Badge>
                      </div>
                      <p className="muted small">{item.subject} · {item.topic}</p>
                      <p className="muted small">{item.preview}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
