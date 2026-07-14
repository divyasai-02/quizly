"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { login } from "@/lib/authClient";
import { demoLoginByRole, demoUsers, getRoleHome, type DemoRoleKey } from "@/lib/demoSession";

const roleIcons = {
  professor: Sparkles,
  student: Users,
  admin: ShieldCheck
} as const;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login({ email, password });
      window.location.assign(getRoleHome(result.user.roleKey));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(role: DemoRoleKey) {
    setLoading(true);
    setError(null);

    try {
      const credentials = demoLoginByRole[role];
      const result = await login(credentials);
      window.location.assign(getRoleHome(result.user.roleKey));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Demo login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero" style={{ maxWidth: 1100 }}>
        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", alignItems: "start" }}>
          <div className="grid">
            <div className="badge purple">Secure login</div>
            <h1>Sign in to Quizly with a real local account.</h1>
            <p className="muted">
              This phase uses password-based auth with an HTTP-only session cookie while keeping seeded demo accounts easy to access for local product walkthroughs.
            </p>
            <div className="grid grid-3">
              {(["professor", "student", "admin"] as DemoRoleKey[]).map((role) => {
                const Icon = roleIcons[role];
                const user = demoUsers[role];
                return (
                  <button
                    key={role}
                    className="card pad"
                    type="button"
                    onClick={() => handleDemoLogin(role)}
                    disabled={loading}
                    style={{ textAlign: "left" }}
                  >
                    <div className="landing-card-top">
                      <div className="icon-tile purple">
                        <Icon size={22} />
                      </div>
                      <strong>{user.title}</strong>
                    </div>
                    <p className="muted small" style={{ margin: "10px 0" }}>{demoLoginByRole[role].email}</p>
                    <span className="btn full">Continue as {user.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <section className="card pad">
            <h2 style={{ marginTop: 0 }}>Login</h2>
            <form className="grid" onSubmit={handleSubmit}>
              <label>
                <strong>Email</strong>
                <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="professor@quizly.local" />
              </label>
              <label>
                <strong>Password</strong>
                <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
              </label>
              {error ? <div className="notice">{error}</div> : null}
              <button className="btn primary full" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
            <div className="toolbar-inline" style={{ marginTop: 16 }}>
              <Link className="linkish" href="/">Back to home</Link>
              <Link className="linkish" href="/register">Create an account <ArrowRight size={14} /></Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
