"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { SkeletonCard } from "@/components/ui";
import { classApi } from "@/lib/apiClient";

export default function ClassesPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    classApi.list().then(setRows).catch(() => undefined);
  }, []);

  return (
    <AppShell title="Classes" subtitle="Organize cohorts and assign quizzes.">
      <div className="content grid">
        <div className="section-head"><h2>Classroom</h2><button className="btn primary" disabled title="Coming soon"><Plus size={17} />Add Class</button></div>
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
    </AppShell>
  );
}
