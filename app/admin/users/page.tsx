"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function AdminUsersPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/admin/summary")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ users: [] }));
  }, []);

  return (
    <AppShell title="Users" subtitle="Review all seeded users and role assignments in the demo environment.">
      <div className="content">
        <section className="card">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {(data?.users ?? []).map((user: any) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
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
