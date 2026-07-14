"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

export default function AdminSubjectsPage() {
  const [data, setData] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [targetSubject, setTargetSubject] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.subjects()
      .then(setData)
      .catch(() => setData({ subjects: [] }));
  }, []);

  function openSubject(subject: any) {
    setSelected(subject);
    setTargetSubject(subject.subject);
    setActionNotice(null);
  }

  async function updateSubject(action: "merge" | "rename") {
    if (!selected) return;
    setSaving(true);
    setActionNotice(null);
    try {
      const payload = await adminApi.updateSubject(selected.subject, { action, targetSubject });
      setData(payload);
      setSelected(null);
      setActionNotice(action === "merge" ? "Subject merged." : "Subject renamed.");
    } catch (error) {
      setActionNotice(error instanceof Error ? error.message : "Subject update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Subjects" subtitle="View and curate the subject taxonomy across classes, quizzes, and question-bank records.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>Subject Taxonomy</h2>
            <p className="muted small">Rename subjects or merge duplicate labels across the operational dataset.</p>
          </div>
        </div>

        {actionNotice ? <div className="notice">{actionNotice}</div> : null}

        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <div className="grid grid-3">
            {data.subjects.map((subject: any) => (
              <section className="card pad" key={subject.subject} style={{ borderBottom: `5px solid var(--${subject.accent})` }}>
                <div className="section-head">
                  <h3>{subject.subject}</h3>
                  <Badge tone={subject.accent}>{subject.averagePerformance}% avg</Badge>
                </div>
                <div className="grid grid-2">
                  <div className="soft-panel pad-sm"><span className="muted small">Classes</span><strong style={{ display: "block" }}>{subject.classes}</strong></div>
                  <div className="soft-panel pad-sm"><span className="muted small">Quizzes</span><strong style={{ display: "block" }}>{subject.quizzes}</strong></div>
                  <div className="soft-panel pad-sm"><span className="muted small">Questions</span><strong style={{ display: "block" }}>{subject.questions}</strong></div>
                  <div className="soft-panel pad-sm"><span className="muted small">Attempts</span><strong style={{ display: "block" }}>{subject.attempts}</strong></div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button className="btn" onClick={() => openSubject(subject)} type="button">Rename / Merge</button>
                </div>
              </section>
            ))}
          </div>
        )}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="subject-modal-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="subject-modal-title">{selected.subject}</h2>
                  <p className="muted small">{selected.classes} classes, {selected.quizzes} quizzes, {selected.questions} questions</p>
                </div>
                <button className="btn" onClick={() => setSelected(null)} type="button">Close</button>
              </div>
              <section className="soft-panel pad-sm grid">
                <label>
                  <strong>Target subject name</strong>
                  <input className="input" value={targetSubject} onChange={(event) => setTargetSubject(event.target.value)} />
                </label>
                <p className="muted small">Rename changes this subject label everywhere it appears. Merge moves this subject into an existing or new target label.</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn primary" onClick={() => updateSubject("rename")} disabled={saving} type="button">{saving ? "Saving..." : "Rename Subject"}</button>
                  <button className="btn" onClick={() => updateSubject("merge")} disabled={saving} type="button">Merge Into Target</button>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
