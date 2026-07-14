"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

type ModerationAction = "approve" | "flag" | "hide" | "restore";

export default function AdminAiModerationPage() {
  const [data, setData] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    adminApi.aiGenerations()
      .then(setData)
      .catch(() => setData({ generations: [] }));
  }, []);

  async function runModerationAction(item: any, action: ModerationAction) {
    setBusyId(item.id);
    setActionNotice(null);
    try {
      const payload = await adminApi.updateAiGeneration(item.id, {
        action,
        note: action === "flag" ? `Flagged for review: ${item.warnings}` : undefined
      });
      setData(payload);
      const updated = payload.generations.find((record: any) => record.id === item.id);
      if (selected?.id === item.id) setSelected(updated ?? null);
      setActionNotice(`${item.topic} was ${action === "approve" ? "approved" : action === "flag" ? "flagged" : action === "hide" ? "hidden" : "restored"}.`);
    } catch (error) {
      setActionNotice(error instanceof Error ? error.message : "Moderation action failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell title="AI Moderation" subtitle="Review AI-generated content, approve safe records, flag concerns, and hide records from active review.">
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
                    <td>{item.subject} - {item.topic}</td>
                    <td>{item.generatedQuestionCount}</td>
                    <td>{item.confidence}</td>
                    <td>{item.warnings}</td>
                    <td><Badge tone={item.status === "Needs Review" ? "amber" : item.status === "Accepted" ? "green" : item.status === "Flagged" || item.status === "Hidden" ? "pink" : "blue"}>{item.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button className="linkish" onClick={() => setSelected(item)} type="button">View</button>
                        <button className="linkish" onClick={() => runModerationAction(item, "approve")} disabled={busyId === item.id} type="button">Approve</button>
                        <button className="linkish" onClick={() => runModerationAction(item, "flag")} disabled={busyId === item.id} type="button">Flag</button>
                        <button className="linkish" onClick={() => runModerationAction(item, item.status === "Hidden" ? "restore" : "hide")} disabled={busyId === item.id} type="button">{item.status === "Hidden" ? "Restore" : "Hide"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {actionNotice ? <div className="notice">{actionNotice}</div> : null}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-record-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="ai-record-title">{selected.type.replaceAll("_", " ")}</h2>
                  <p className="muted small">{selected.subject} - {selected.topic} - {selected.createdAt}</p>
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
              {selected.moderationNote ? (
                <section className="soft-panel pad-sm">
                  <strong>Moderation Note</strong>
                  <p className="muted small">{selected.moderationNote}</p>
                </section>
              ) : null}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" onClick={() => runModerationAction(selected, "approve")} disabled={busyId === selected.id} type="button">Approve</button>
                <button className="btn" onClick={() => runModerationAction(selected, "flag")} disabled={busyId === selected.id} type="button">Flag</button>
                <button className="btn" onClick={() => runModerationAction(selected, selected.status === "Hidden" ? "restore" : "hide")} disabled={busyId === selected.id} type="button">{selected.status === "Hidden" ? "Restore" : "Hide"}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
