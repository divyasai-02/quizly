"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

export default function AdminClassroomPage() {
  const [data, setData] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    adminApi.classes()
      .then(setData)
      .catch(() => setData({ classes: [] }));
  }, []);

  return (
    <AppShell title="Classroom Oversight" subtitle="Review every class, its ownership, learner load, assessment volume, and recent movement.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <>
            <div className="grid grid-3">
              {data.classes.map((classroom: any) => (
                <section className="card pad" key={classroom.id}>
                  <div className="section-head">
                    <div>
                      <h3>{classroom.name}</h3>
                      <p className="muted small">{classroom.subject}</p>
                    </div>
                    <Badge tone={classroom.averagePerformance >= 75 ? "green" : classroom.averagePerformance >= 60 ? "blue" : "amber"}>{classroom.averagePerformance}% avg</Badge>
                  </div>
                  <div className="grid grid-3">
                    <div className="soft-panel pad-sm"><span className="muted small">Professor</span><strong style={{ display: "block" }}>{classroom.professor}</strong></div>
                    <div className="soft-panel pad-sm"><span className="muted small">Students</span><strong style={{ display: "block" }}>{classroom.studentCount}</strong></div>
                    <div className="soft-panel pad-sm"><span className="muted small">Quizzes</span><strong style={{ display: "block" }}>{classroom.quizCount}</strong></div>
                  </div>
                  <p className="muted small" style={{ marginTop: 12 }}>{classroom.recentActivity}</p>
                  <button className="btn primary" onClick={() => setSelected(classroom)} style={{ marginTop: 12 }} type="button">Manage</button>
                </section>
              ))}
            </div>

            <section className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Professor</th>
                    <th>Students</th>
                    <th>Quizzes</th>
                    <th>Average Performance</th>
                    <th>Recent Activity</th>
                    <th>Updated</th>
                    <th>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classes.map((classroom: any) => (
                    <tr key={classroom.id}>
                      <td><strong>{classroom.name}</strong><div className="muted small">{classroom.subject}</div></td>
                      <td>{classroom.professor}</td>
                      <td>{classroom.studentCount}</td>
                      <td>{classroom.quizCount}</td>
                      <td>{classroom.averagePerformance}%</td>
                      <td>{classroom.recentActivity}</td>
                      <td>{classroom.updatedAt}</td>
                      <td><button className="btn" onClick={() => setSelected(classroom)} type="button">Manage</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="classroom-manage-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="classroom-manage-title">{selected.name}</h2>
                  <p className="muted small">{selected.subject} · Managed by {selected.professor}</p>
                </div>
                <button className="btn" onClick={() => setSelected(null)} type="button">Close</button>
              </div>
              <div className="grid grid-4">
                <div className="soft-panel pad-sm"><span className="muted small">Students</span><strong style={{ display: "block" }}>{selected.studentCount}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Quizzes</span><strong style={{ display: "block" }}>{selected.quizCount}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Average</span><strong style={{ display: "block" }}>{selected.averagePerformance}%</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Updated</span><strong style={{ display: "block" }}>{selected.updatedAt}</strong></div>
              </div>
              <section className="soft-panel pad-sm">
                <strong>Recent Activity</strong>
                <p className="muted small">{selected.recentActivity}</p>
              </section>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" disabled type="button">Reassign Professor - Coming Soon</button>
                <button className="btn" disabled type="button">Class Actions - Coming Soon</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
