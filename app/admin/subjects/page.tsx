"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

export default function AdminSubjectsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    adminApi.subjects()
      .then(setData)
      .catch(() => setData({ subjects: [] }));
  }, []);

  return (
    <AppShell title="Subjects" subtitle="View the active subject taxonomy with class, quiz, question, and performance context.">
      <div className="content grid">
        <div className="section-head">
          <div>
            <h2>Subject Taxonomy</h2>
            <p className="muted small">Subjects now carry enough operational context to support future curation and cleanup workflows.</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn primary" disabled type="button"><Plus size={16} />Add Subject - Coming Soon</button>
            <button className="btn" disabled type="button">Merge Duplicate Subject - Coming Soon</button>
          </div>
        </div>

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
                  <button className="btn" disabled type="button">Edit - Coming Soon</button>
                  <button className="btn" disabled type="button">Delete - Coming Soon</button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
