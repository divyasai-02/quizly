"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { getRoleHome } from "@/lib/demoSession";
import { register } from "@/lib/authClient";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "STUDENT" as "STUDENT" | "PROFESSOR"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const emailName = form.email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
      const name = emailName && emailName.length >= 2 ? emailName : `${form.role === "PROFESSOR" ? "Professor" : "Student"} User`;
      const result = await register({
        ...form,
        name,
        confirmPassword: form.password
      });
      window.location.assign(getRoleHome(result.user.roleKey));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero" style={{ maxWidth: 760 }}>
        <div className="badge purple">Create account</div>
        <h1>Register a new Quizly account.</h1>
        <p className="muted">
          Select a role and create your account with an email and password.
        </p>

        <section className="card pad" style={{ maxWidth: 460 }}>
          <form className="grid" onSubmit={handleSubmit}>
            <label>
              <strong>Role</strong>
              <select className="select" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "STUDENT" | "PROFESSOR" }))}>
                <option value="STUDENT">Student</option>
                <option value="PROFESSOR">Professor</option>
              </select>
            </label>
            <label>
              <strong>Email</strong>
              <input className="input" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@quizly.local" />
            </label>
            <label>
              <strong>Password</strong>
              <input className="input" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" />
            </label>
            {error ? <div className="notice">{error}</div> : null}
            <button className="btn primary full" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>
          <div className="toolbar-inline" style={{ marginTop: 16 }}>
            <Link className="linkish" href="/login">Already have an account? Login <ArrowRight size={14} /></Link>
            <Link className="linkish" href="/">Back to home</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
