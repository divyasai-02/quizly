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
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
    <AppShell title="Users" subtitle="Review account mix, inspect profile context, and manage role or access changes.">
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
              <option>Deactivated</option>
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
                    <td><Badge tone={user.status === "Active" ? "green" : user.status === "Platform Admin" ? "purple" : user.status === "Deactivated" ? "pink" : "amber"}>{user.status}</Badge></td>
                    <td>
                      <div className="table-actions">
                        <button className="linkish" onClick={() => setSelected(user)} type="button">View</button>
                        <button className="linkish" onClick={() => setSelected(user)} type="button">Change Role</button>
                        <button className="linkish" onClick={() => setSelected(user)} type="button">{user.disabledAt ? "Reactivate" : "Deactivate"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {actionNotice ? <div className="notice">{actionNotice}</div> : null}

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
              <AdminUserActions
                selected={selected}
                onUpdated={(payload) => {
                  setData(payload);
                  const updated = payload.users.find((user: any) => user.id === selected.id);
                  setSelected(updated ?? null);
                  setActionNotice(`${selected.name} was updated.`);
                }}
                onNotice={setActionNotice}
              />
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function AdminUserActions({ selected, onNotice, onUpdated }: { selected: any; onNotice: (message: string | null) => void; onUpdated: (payload: any) => void }) {
  const [role, setRole] = useState(selected.role);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRole(selected.role);
  }, [selected.id, selected.role]);

  async function runAction(input: { action: "changeRole" | "deactivate" | "reactivate"; role?: string }) {
    setBusy(true);
    onNotice(null);
    try {
      const payload = await adminApi.updateUser(selected.id, input);
      onUpdated(payload);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "User action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="soft-panel pad-sm grid">
      <div className="section-head">
        <div>
          <strong>Account Controls</strong>
          <p className="muted small">Apply persistent user role and access changes.</p>
        </div>
        <Badge tone={selected.disabledAt ? "pink" : "green"}>{selected.disabledAt ? "Deactivated" : "Enabled"}</Badge>
      </div>
      <div className="toolbar-inline">
        <select className="select" value={role} onChange={(event) => setRole(event.target.value)} disabled={busy}>
          <option>PROFESSOR</option>
          <option>STUDENT</option>
          <option>ADMIN</option>
        </select>
        <button className="btn primary" onClick={() => runAction({ action: "changeRole", role })} disabled={busy || role === selected.role} type="button">Apply Role</button>
        {selected.disabledAt ? (
          <button className="btn" onClick={() => runAction({ action: "reactivate" })} disabled={busy} type="button">Reactivate</button>
        ) : (
          <button className="btn" onClick={() => runAction({ action: "deactivate" })} disabled={busy} type="button">Deactivate</button>
        )}
      </div>
    </div>
  );
}
