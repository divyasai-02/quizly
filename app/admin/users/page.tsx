"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { adminApi } from "@/lib/apiClient";

export default function AdminUsersPage() {
  const [data, setData] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    adminApi.users()
      .then(setData)
      .catch(() => setData({ users: [] }));
  }, []);

  const rows = useMemo(() => {
    const all = data?.users ?? [];
    return all.filter((user: any) => {
      const matchesSearch = !search || `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [data, roleFilter, search, statusFilter]);

  return (
    <AppShell title="Users" subtitle="Review account mix, inspect profile context, and keep guardrails visible before real user management ships.">
      <div className="content grid">
        <div className="section-head">
          <h2>User Directory</h2>
          <div className="toolbar-inline">
            <label className="search search-inline">
              <Search size={18} />
              <input placeholder="Search name or email..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <select className="select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option>All</option>
              <option>PROFESSOR</option>
              <option>STUDENT</option>
              <option>ADMIN</option>
            </select>
            <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>All</option>
              <option>Active</option>
              <option>Quiet</option>
              <option>Needs onboarding</option>
              <option>Platform Admin</option>
            </select>
          </div>
        </div>

        {!data ? (
          <div className="grid grid-3">{Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : !rows.length ? (
          <EmptyState title="No users match these filters" text="Try another search, role, or status filter." />
        ) : (
          <section className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Classes / Enrollments</th>
                  <th>Quizzes / Attempts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user: any) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.joinedDate}</td>
                    <td>{user.classesOrEnrollments}</td>
                    <td>{user.quizzesOrAttempts}</td>
                    <td><Badge tone={user.status === "Active" ? "green" : user.status === "Platform Admin" ? "purple" : "amber"}>{user.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button className="linkish" onClick={() => setSelected(user)} type="button">View</button>
                        <button className="linkish" disabled type="button">Change Role</button>
                        <button className="linkish" disabled type="button">Deactivate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {selected ? (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-profile-title">
            <div className="modal-card pad grid">
              <div className="section-head">
                <div>
                  <h2 id="user-profile-title">{selected.name}</h2>
                  <p className="muted small">{selected.email}</p>
                </div>
                <button className="btn" onClick={() => setSelected(null)} type="button">Close</button>
              </div>
              <div className="grid grid-4">
                <div className="soft-panel pad-sm"><span className="muted small">Role</span><strong style={{ display: "block" }}>{selected.profile.role}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Joined</span><strong style={{ display: "block" }}>{selected.profile.joinedDate}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Quizzes Created</span><strong style={{ display: "block" }}>{selected.profile.quizzesCreated}</strong></div>
                <div className="soft-panel pad-sm"><span className="muted small">Attempts Taken</span><strong style={{ display: "block" }}>{selected.profile.attemptsTaken}</strong></div>
              </div>
              <section className="soft-panel pad-sm">
                <strong>Classes</strong>
                <p className="muted small">{selected.profile.classes.length ? selected.profile.classes.join(", ") : "No linked classes yet."}</p>
              </section>
              <section className="soft-panel pad-sm">
                <strong>Profile Summary</strong>
                <p className="muted small">{selected.profile.summary}</p>
              </section>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn primary" disabled type="button">Change Role - Coming Soon</button>
                <button className="btn" disabled type="button">Suspend / Deactivate - Coming Soon</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
