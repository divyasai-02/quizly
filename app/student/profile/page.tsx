"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProgressRing } from "@/components/ui";

export default function StudentProfilePage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ studentName: "Student", xp: 0, level: 1, averageAccuracy: 0, completedHistory: [] }));
  }, []);

  return (
    <AppShell title="Profile" subtitle="See your progress snapshot, quiz history, and earned momentum.">
      <div className="content grid grid-2">
        <section className="card pad">
          <div className="profile-panel">
            <div className="avatar profile-avatar">{data?.studentName?.split(" ").map((part: string) => part[0]).join("").slice(0, 2) ?? "ST"}</div>
            <div>
              <h2>{data?.studentName ?? "Student"}</h2>
              <p className="muted">Class learner profile</p>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="soft-panel pad-sm"><span className="muted small">XP</span><strong>{data?.xp ?? 0}</strong></div>
            <div className="soft-panel pad-sm"><span className="muted small">Level</span><strong>{data?.level ?? 1}</strong></div>
          </div>
          <div style={{ marginTop: 18 }}>
            <ProgressRing value={Math.min(100, data?.averageAccuracy ?? 0)} label={`${data?.averageAccuracy ?? 0}%`} total="Accuracy" />
          </div>
        </section>
        <section className="card pad">
          <h2>Quiz History Summary</h2>
          <div className="grid">
            {(data?.completedHistory ?? []).map((item: any) => (
              <div className="row-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <div className="muted small">{item.status}</div>
                </div>
                <span className="spacer" />
                <strong>{item.percentage}%</strong>
              </div>
            ))}
          </div>
          <div className="soft-panel pad-sm" style={{ marginTop: 18 }}>
            <strong>Accuracy trend</strong>
            <p className="muted small">Trend chart placeholder for the next analytics pass.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
