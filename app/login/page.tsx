"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { login } from "@/lib/authClient";
import { getRoleHome } from "@/lib/demoSession";

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

  return (
    <main className="landing-shell">
      <section className="landing-hero auth-choice-hero">
        <div className="role-choice-intro">
          <div className="badge purple">Secure login</div>
          <h1>Sign in to Quizly</h1>
          <p className="muted">Enter your email and password to continue.</p>
        </div>

          <section className="card pad" style={{ maxWidth: 460, margin: "0 auto" }}>
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
      </section>
    </main>
  );
}
