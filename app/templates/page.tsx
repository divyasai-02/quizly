"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";
import { templateApi } from "@/lib/apiClient";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[] | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [filters, setFilters] = useState({ subject: "All", difficulty: "All", length: "All" });

  useEffect(() => {
    templateApi.list().then((data) => setTemplates(data.templates)).catch(() => setTemplates([]));
  }, []);

  const subjects = useMemo(() => ["All", ...new Set((templates ?? []).map((item) => item.subject))], [templates]);

  const filtered = useMemo(() => {
    return (templates ?? []).filter((item) => {
      if (filters.subject !== "All" && item.subject !== filters.subject) return false;
      if (filters.difficulty !== "All" && item.difficulty !== filters.difficulty) return false;
      if (filters.length === "Short" && item.estimatedDuration > 10) return false;
      if (filters.length === "Medium" && (item.estimatedDuration <= 10 || item.estimatedDuration > 20)) return false;
      if (filters.length === "Long" && item.estimatedDuration <= 20) return false;
      return true;
    });
  }, [filters, templates]);

  async function openPreview(id: string) {
    const data = await templateApi.get(id);
    setPreview(data.template);
  }

  async function applyTemplate(id: string) {
    const result = await templateApi.createQuiz(id);
    router.push(result.redirectTo);
  }

  return (
    <AppShell title="Template Library" subtitle="Clone structured quiz starters directly into editable draft quizzes.">
      <div className="content grid">
        <section className="card pad">
          <div className="toolbar-inline">
            <select className="select" value={filters.subject} onChange={(event) => setFilters((value) => ({ ...value, subject: event.target.value }))}>{subjects.map((value) => <option key={value}>{value}</option>)}</select>
            <select className="select" value={filters.difficulty} onChange={(event) => setFilters((value) => ({ ...value, difficulty: event.target.value }))}><option>All</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
            <select className="select" value={filters.length} onChange={(event) => setFilters((value) => ({ ...value, length: event.target.value }))}><option>All</option><option>Short</option><option>Medium</option><option>Long</option></select>
          </div>
        </section>
        {!templates ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <div className="grid grid-3">
            {filtered.map((template) => (
              <div className="card pad" key={template.id}>
                <div className="section-head" style={{ marginBottom: 10 }}>
                  <div className="icon-tile"><Copy size={24} /></div>
                  <Badge tone={template.difficulty === "Easy" ? "green" : template.difficulty === "Hard" ? "pink" : "amber"}>{template.difficulty}</Badge>
                </div>
                <h3>{template.title}</h3>
                <p className="muted">{template.subject}</p>
                <p>{template.description}</p>
                <p className="muted small">{template.questionCount} questions · {template.estimatedDuration} min</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  {template.tags.map((tag: string) => <Badge key={tag} tone="blue">{tag}</Badge>)}
                </div>
                <div className="grid">
                  <button className="btn primary full" onClick={() => applyTemplate(template.id)} type="button">Use Template</button>
                  <button className="btn full" onClick={() => openPreview(template.id)} type="button"><Eye size={16} />Preview</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="template-preview-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <h2 id="template-preview-title">{preview.title}</h2>
              <button className="btn" onClick={() => setPreview(null)} type="button">Close</button>
            </div>
            <p className="muted">{preview.description}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge>{preview.subject}</Badge>
              <Badge tone={preview.difficulty === "Easy" ? "green" : preview.difficulty === "Hard" ? "pink" : "amber"}>{preview.difficulty}</Badge>
              <Badge tone="blue">{preview.estimatedDuration} min</Badge>
            </div>
            <div className="grid">
              {preview.questions.map((question: any, index: number) => (
                <div className="soft-panel pad-sm" key={`${preview.id}-${index}`}>
                  <strong>{index + 1}. {question.text}</strong>
                  <p className="muted small">{question.topic} · {question.difficulty}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={() => applyTemplate(preview.id)} type="button">Use Template</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
