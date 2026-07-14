"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SkeletonCard } from "@/components/ui";
import { classApi } from "@/lib/apiClient";

export default function ClassesPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", section: "" });
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function loadClasses() {
    classApi.list().then(setRows).catch(() => setRows([]));
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function createClass() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const created = await classApi.create(form);
      setNotice(`Created class: ${created.name}`);
      setShowCreate(false);
      setForm({ name: "", subject: "", section: "" });
      loadClasses();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to create class.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Classes" subtitle="Organize cohorts and assign quizzes.">
      <div className="content grid">
        <div className="section-head"><h2>Classroom</h2><button className="btn primary" onClick={() => setShowCreate(true)} type="button"><Plus size={17} />Add Class</button></div>
        {error ? <div className="notice">{error}</div> : null}
        {notice ? <div className="notice success">{notice}</div> : null}
        {!rows ? <div className="grid grid-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={3} />)}</div> : (
        <div className="grid grid-4">
          {rows.map((item) => (
            <div className="card pad" key={item.name}>
              <div className="icon-tile">{item.code}</div>
              <h3>{item.name}</h3>
              <p className="muted">{item.students} students - {item.quizzes} quizzes</p>
              <Link className="btn full" href="/analytics">Open Class Analytics</Link>
            </div>
          ))}
        </div>
        )}
      </div>

      {showCreate ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="class-create-title">
          <div className="modal-card pad grid">
            <div className="section-head">
              <h2 id="class-create-title">Add Class</h2>
              <button className="btn" onClick={() => setShowCreate(false)} type="button">Close</button>
            </div>
            <label><strong>Class name</strong><input className="input" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder="CSE - B" /></label>
            <label><strong>Subject</strong><input className="input" value={form.subject} onChange={(event) => setForm((value) => ({ ...value, subject: event.target.value }))} placeholder="Computer Science" /></label>
            <label><strong>Section</strong><input className="input" value={form.section} onChange={(event) => setForm((value) => ({ ...value, section: event.target.value }))} placeholder="B" /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button className="btn" onClick={() => setShowCreate(false)} disabled={saving} type="button">Cancel</button>
              <button className="btn primary" onClick={createClass} disabled={saving} type="button">{saving ? "Creating..." : "Create Class"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
