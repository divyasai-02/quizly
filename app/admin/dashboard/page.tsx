"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard, StatCard } from "@/components/ui";

const icons = [ShieldCheck, ShieldCheck, ShieldCheck, ShieldCheck, ShieldCheck, ShieldCheck];

export default function AdminDashboardPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ stats: [], recentActivity: [] }));
  }, []);

  return (
    <AppShell title="Admin Home" subtitle="Monitor the Quizly platform, people, and operational health.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}</div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.stats.map((stat: any, index: number) => (
                <StatCard key={stat.label} {...stat} icon={icons[index]} />
              ))}
            </div>
            <div className="grid grid-2">
              <section className="card pad">
                <div className="section-head">
                  <h2>Recent Activity</h2>
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
                  <h2>System Health</h2>
                  <Badge tone="green">Healthy</Badge>
                </div>
                <div className="grid">
                  <div className="soft-panel pad-sm"><strong>API availability</strong><p className="muted small">Nominal for this demo environment.</p></div>
                  <div className="soft-panel pad-sm"><strong>AI moderation queue</strong><p className="muted small">Placeholder panel for the next moderation pass.</p></div>
                  <button className="btn" disabled type="button"><Sparkles size={16} />Moderation tools - Coming soon</button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
