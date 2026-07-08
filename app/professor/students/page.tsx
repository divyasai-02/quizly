"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";

export default function ProfessorStudentsPage() {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/professor/students")
      .then((response) => response.json())
      .then((data) => setRows(data.students ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <AppShell title="Students" subtitle="Track roster health and identify who needs support.">
      <div className="content grid">
        <div className="section-head">
          <h2>Student Roster</h2>
          <div className="toolbar-inline">
            <label className="search search-inline">
              <Search size={18} />
              <input placeholder="Search students..." disabled />
            </label>
            <select className="select" disabled><option>All Classes</option></select>
          </div>
        </div>
        {!rows ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Quizzes Taken</th>
                  <th>Average Score</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={`${student.name}-${student.className}`}>
                    <td><strong>{student.name}</strong></td>
                    <td>{student.className}</td>
                    <td>{student.quizzesTaken}</td>
                    <td>{student.averageScore}%</td>
                    <td>{student.accuracy}%</td>
                    <td><Badge tone={student.needsAttention ? "amber" : "green"}>{student.needsAttention ? "Needs attention" : "On track"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </AppShell>
  );
}
