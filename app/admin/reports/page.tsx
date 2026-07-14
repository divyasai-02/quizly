"use client";

import { Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui";

const formats = [
  { label: "CSV", value: "csv" },
  { label: "PDF", value: "pdf" },
  { label: "Excel", value: "excel" }
] as const;

export default function AdminReportsPage() {
  function download(format: string) {
    window.open(`/api/admin/reports/export?format=${format}`, "_blank");
  }

  return (
    <AppShell title="Institution Reports" subtitle="Export institution-level operational reports across users, classes, quizzes, attempts, AI activity, and question-bank content.">
      <div className="content grid">
        <section className="ai-panel">
          <div>
            <Badge tone="purple"><ShieldCheck size={14} /> Institution Reporting</Badge>
            <h2>Export the platform overview for leadership review.</h2>
            <p className="muted">This report aggregates core institution metrics and records the export in the admin audit trail.</p>
            <div className="toolbar-inline">
              {formats.map((format) => (
                <button className="btn primary" key={format.value} onClick={() => download(format.value)} type="button">
                  {format.value === "excel" ? <FileSpreadsheet size={16} /> : <Download size={16} />}
                  Export {format.label}
                </button>
              ))}
            </div>
          </div>
          <div className="insight-list">
            <div className="insight-item"><span className="muted">Scope</span><strong>Institution-wide</strong></div>
            <div className="insight-item"><span className="muted">Includes</span><strong>Users, classes, quizzes, attempts, AI</strong></div>
            <div className="insight-item"><span className="muted">Audit</span><strong>Every export is recorded</strong></div>
          </div>
        </section>

        <section className="card pad">
          <h2>Available Reports</h2>
          <div className="grid grid-3">
            <div className="soft-panel pad-sm"><strong>Institution Overview</strong><p className="muted small">Platform-wide totals and average score.</p></div>
            <div className="soft-panel pad-sm"><strong>Operational Coverage</strong><p className="muted small">Classrooms, quizzes, reusable question-bank items.</p></div>
            <div className="soft-panel pad-sm"><strong>AI Activity</strong><p className="muted small">Recorded AI generation volume for governance review.</p></div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
