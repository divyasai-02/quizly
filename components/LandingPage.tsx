"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui";
import { login } from "@/lib/authClient";
import { demoLoginByRole, demoUsers, getRoleHome } from "@/lib/demoSession";

const roleOptions = [
  { role: "professor" as const, label: "Professor", text: "Create quizzes and manage classes" },
  { role: "student" as const, label: "Student", text: "Take quizzes and track your progress" },
  { role: "admin" as const, label: "Administrator", text: "Manage users and platform activity" }
];

export function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<keyof typeof demoUsers>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(demoLoginByRole[selectedRole]);
      window.location.assign(getRoleHome(result.user.roleKey));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Demo login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero role-choice-hero">
        <div className="role-choice-intro">
          <Badge tone="purple">Welcome to Quizly</Badge>
          <h1>Choose your role</h1>
          <p className="muted">Select how you want to use Quizly to continue.</p>
        </div>

        <form className="role-choice-form" onSubmit={handleContinue}>
          <span className="role-choice-label">I am a...</span>
          <div className="role-options">
            {roleOptions.map(({ role, label, text }) => (
              <label className={`role-option ${selectedRole === role ? "selected" : ""}`} key={role}>
                <input
                  checked={selectedRole === role}
                  name="role"
                  onChange={() => setSelectedRole(role)}
                  type="radio"
                  value={role}
                />
                <span>
                  <strong>{label}</strong>
                  <small>{text}</small>
                </span>
              </label>
            ))}
          </div>
          {error ? <div className="notice">{error}</div> : null}
          <button className="btn primary full" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <div className="role-choice-links">
          <span className="muted small">Already have an account?</span>
          <Link href="/login">Sign in</Link>
          <span className="muted small">or</span>
          <Link href="/register">create an account</Link>
        </div>
      </section>
    </main>
  );
}
