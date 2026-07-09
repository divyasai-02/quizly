"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

export default function AdminAiModerationPage() {
  const [data, setData] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    adminApi.aiGenerations()
      .then(setData)
      .catch(() => setData({ generations: [] }));
  }, []);

  return (
    <AppShell title="AI Moderation" subtitle="Review recent AI-generated content, warnings, and future moderation actions from one operational queue.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Type</th>
                  <th>Subject / Topic</th>
                  <th>Question Count</th>
                  <th>Confidence</th>
                  <th>Warnings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.generations.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.professor}</td>
                    <td>{item.type.replaceAll("_", " ")}</td>
                    <td>{item.subject} · {item.topic}</td>
                    <td>{item.generatedQuestionCount}</td>
                    <td>{item.confidence}</td>
                    <td>{item.warnings}</td>
                    <td><Badge tone={item.status === "Needs Review" ? "amber" : item.status === "Accepted" ? "green" : "blue"}>{item.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button className="linkish" onClick={() => setSelected(item)} type="button">View</button>
                        <button className="linkish" disabled type="button">Approve</button>
                        <button className="linkish" disabled type="button">Flag</button>
                        <button className="linkish" disabled type="button">Hide</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-record-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="ai-record-title">{selected.type.replaceAll("_", " ")}</h2>
                  <p className="muted small">{selected.subject} · {selected.topic} · {selected.createdAt}</p>
                </div>
                <button className="btn" onClick={() => setSelected(null)} type="button">Close</button>
              </div>
              <div className="grid grid-4">
                <div className="soft-panel pad-sm"><span className="muted small">Professor</span><strong style={{ display: "block" }}>{selected.professor}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Questions</span><strong style={{ display: "block" }}>{selected.generatedQuestionCount}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Confidence</span><strong style={{ display: "block" }}>{selected.confidence}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Status</span><strong style={{ display: "block" }}>{selected.status}</strong></div>
              </div>
              <section className="soft-panel pad-sm">
                <strong>Warnings</strong>
                <p className="muted small">{selected.warnings}</p>
              </section>
              <section className="soft-panel pad-sm">
                <strong>Preview</strong>
                <p className="muted small">{selected.preview}</p>
              </section>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" disabled type="button">Approve - Coming Soon</button>
                <button className="btn" disabled type="button">Flag - Coming Soon</button>
                <button className="btn" disabled type="button">Delete - Coming Soon</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
