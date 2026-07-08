"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminClassroomPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ classrooms: [] }));
  }, []);

  return (
    <AppShell title="Classroom" subtitle="Review classes, assigned professors, and classroom scale at a glance.">
      <div className="content">
        <section className="card">
          <table className="table">
            <thead><tr><th>Class</th><th>Professor</th><th>Students</th><th>Quizzes</th><th>Manage</th></tr></thead>
            <tbody>
              {(data?.classrooms ?? []).map((classroom: any) => (
                <tr key={classroom.id}>
                  <td><strong>{classroom.name}</strong><br /><span className="muted small">{classroom.subject}</span></td>
                  <td>{classroom.professor}</td>
                  <td>{classroom.studentCount}</td>
                  <td>{classroom.quizCount}</td>
                  <td><button className="btn" disabled type="button">Manage</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
