"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileSpreadsheet, Filter, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { reportsApi } from "@/lib/apiClient";

type Filters = {
  classId: string;
  quizId: string;
  studentId: string;
  reportType: string;
  from: string;
  to: string;
};

const initialFilters: Filters = {
  classId: "",
  quizId: "",
  studentId: "",
  reportType: "quizResults",
  from: "",
  to: ""
};

function toQueryString(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.classId) params.set("classId", filters.classId);
  if (filters.quizId) params.set("quizId", filters.quizId);
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.reportType) params.set("reportType", filters.reportType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const value = params.toString();
  return value ? `?${value}` : "";
}

export default function ProfessorReportsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedReportIds, setDismissedReportIds] = useState<string[]>([]);

  const query = useMemo(() => toQueryString(filters), [filters]);

  useEffect(() => {
    setLoading(true);
    reportsApi.summary(query)
      .then(setData)
      .catch(() => setData({ filters: { classes: [], quizzes: [], students: [], reportTypes: [] }, reportCards: [], recentReports: [], preview: null }))
      .finally(() => setLoading(false));
  }, [query]);

  function downloadReport(type: string, format: "csv" | "pdf" | "excel" = "csv") {
    const params = new URLSearchParams(query.startsWith("?") ? query.slice(1) : query);
    params.set("reportType", type);
    params.set("format", format);
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  }

  const visibleRecentReports = (data?.recentReports ?? []).filter((report: any) => !dismissedReportIds.includes(report.id));

  function renderTable(rows: any[]) {
    if (!rows.length) {
      return <EmptyState title="No report rows yet" text="Adjust the filters or wait for more seeded activity to generate this report." />;
    }
    const headers = Object.keys(rows[0]);
    return (
      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>{headers.map((header) => <th key={header}>{header.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row, index) => (
              <tr key={`${index}-${headers[0]}`}>
                {headers.map((header) => <td key={header}>{Array.isArray(row[header]) ? row[header].join(", ") : String(row[header] ?? "-")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <AppShell title="Reports Center" subtitle="Generate class, quiz, and student summaries that feel ready to export and present.">
      <div className="content grid">
        <section className="card pad">
          <div className="section-head">
            <div>
              <h2>Report Filters</h2>
              <p className="muted small">Scope the preview by class, quiz, learner, and date range.</p>
            </div>
            <Badge tone="purple"><Filter size={14} /> Live Preview</Badge>
          </div>
          <div className="grid grid-3">
            <label>
              <strong>Class</strong>
              <select className="select" value={filters.classId} onChange={(event) => setFilters((current) => ({ ...current, classId: event.target.value }))}>
                <option value="">All Classes</option>
                {(data?.filters?.classes ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <strong>Quiz</strong>
              <select className="select" value={filters.quizId} onChange={(event) => setFilters((current) => ({ ...current, quizId: event.target.value }))}>
                <option value="">All Quizzes</option>
                {(data?.filters?.quizzes ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <strong>Student</strong>
              <select className="select" value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))}>
                <option value="">All Students</option>
                {(data?.filters?.students ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <strong>Report Type</strong>
              <select className="select" value={filters.reportType} onChange={(event) => setFilters((current) => ({ ...current, reportType: event.target.value }))}>
                {(data?.filters?.reportTypes ?? []).map((item: any) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <strong>From</strong>
              <input className="input" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} />
            </label>
            <label>
              <strong>To</strong>
              <input className="input" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} />
            </label>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-3">{Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} lines={5} />)}</div>
        ) : (
          <>
            <div className="grid grid-3">
              {(data?.reportCards ?? []).map((card: any) => (
                <section className="card pad" key={card.key}>
                  <div className="section-head">
                    <h3>{card.title}</h3>
                    {card.isActive ? <Badge tone="green">Previewing</Badge> : <Badge tone="blue">{card.rowCount} rows</Badge>}
                  </div>
                  <p className="muted">{card.description}</p>
                  <div className="soft-panel pad-sm" style={{ marginTop: 14 }}>
                    <div className="settings-row"><span>Last generated</span><strong>{card.lastGenerated}</strong></div>
                    <div className="settings-row"><span>Formats</span><strong>{card.formats.join(" / ")}</strong></div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <button className="btn primary" onClick={() => setFilters((current) => ({ ...current, reportType: card.key }))} type="button"><Eye size={16} />View Preview</button>
                    <button className="btn" onClick={() => downloadReport(card.key, "csv")} type="button"><Download size={16} />Export CSV</button>
                    <button className="btn" onClick={() => downloadReport(card.key, "pdf")} type="button">Export PDF</button>
                    <button className="btn" onClick={() => downloadReport(card.key, "excel")} type="button"><FileSpreadsheet size={16} />Export Excel</button>
                  </div>
                </section>
              ))}
            </div>

            <div className="grid grid-2">
              <section className="card">
                <div className="section-head" style={{ padding: "18px 20px 0" }}>
                  <h2>Recent Reports</h2>
                  <Badge tone="purple">Export-ready</Badge>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Report</th>
                      <th>Type</th>
                      <th>Class / Quiz</th>
                      <th>Generated</th>
                      <th>By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecentReports.map((report: any) => (
                      <tr key={report.id}>
                        <td><strong>{report.name}</strong></td>
                        <td>{report.type}</td>
                        <td>{report.context}</td>
                        <td>{report.generatedAt}</td>
                        <td>{report.generatedBy}</td>
                        <td><Badge tone={report.status === "Ready" ? "green" : "amber"}>{report.status}</Badge></td>
                        <td>
                          <div className="table-actions">
                            <button className="linkish" onClick={() => setFilters((current) => ({ ...current, reportType: report.name.includes("Class") ? "classPerformance" : report.name.includes("Student") ? "studentProgress" : report.name.includes("Question") ? "questionDifficulty" : report.name.includes("Weak") ? "weakTopics" : report.name.includes("Engagement") ? "engagement" : "quizResults" }))} type="button">View</button>
                            <button className="linkish" onClick={() => downloadReport(report.name.includes("Class") ? "classPerformance" : report.name.includes("Student") ? "studentProgress" : report.name.includes("Question") ? "questionDifficulty" : report.name.includes("Weak") ? "weakTopics" : report.name.includes("Engagement") ? "engagement" : "quizResults", "csv")} type="button">Download</button>
                            <button className="linkish" onClick={() => setDismissedReportIds((current) => [...current, report.id])} type="button">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleRecentReports.length ? <div className="pad"><p className="muted">No recent report history is visible.</p></div> : null}
              </section>

              <section className="card pad">
                <div className="section-head">
                  <div>
                    <h2>{data?.preview?.title ?? "Report Preview"}</h2>
                    <p className="muted small">A polished live preview before you export or share the report.</p>
                  </div>
                  <Badge tone="purple"><Sparkles size={14} /> Insight Summary</Badge>
                </div>

                <div className="grid grid-3">
                  {(data?.preview?.cards ?? []).map((card: any) => (
                    <div className="soft-panel pad-sm" key={card.label}>
                      <span className="muted small">{card.label}</span>
                      <strong style={{ display: "block", fontSize: 24 }}>{card.value}</strong>
                      <span className="muted small">{card.hint}</span>
                    </div>
                  ))}
                </div>

                <div className="bars" style={{ marginTop: 18 }}>
                  {(data?.preview?.chart ?? []).slice(0, 6).map((item: any, index: number) => (
                    <div className="bar-wrap" key={`${item.label}-${item.value}-${index}`}>
                      <strong>{item.value}%</strong>
                      <div className="bar" style={{ height: `${Math.max(16, item.value * 1.8)}px`, background: "var(--purple)" }} />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 18 }}>
                  {renderTable(data?.preview?.rows ?? [])}
                </div>

                <div className="soft-panel pad-sm" style={{ marginTop: 18 }}>
                  <strong>AI-style recommendation</strong>
                  <p className="muted small">{data?.preview?.recommendation ?? "More submissions will make the recommendation sharper."}</p>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
