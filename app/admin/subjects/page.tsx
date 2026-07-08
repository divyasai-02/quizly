"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export default function AdminSubjectsPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ subjects: [] }));
  }, []);

  return (
    <AppShell title="Subjects" subtitle="Manage the current subject taxonomy used across Quizly.">
      <div className="content grid">
        <div className="section-head">
          <h2>Subject Taxonomy</h2>
          <button className="btn primary" disabled type="button"><Plus size={16} />Add Subject - Coming soon</button>
        </div>
        <div className="grid grid-3">
          {(data?.subjects ?? []).map((subject: string) => (
            <section className="card pad" key={subject}>
              <h3>{subject}</h3>
              <p className="muted">Available for classroom and quiz assignment.</p>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
