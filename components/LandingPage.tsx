"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export function LandingPage() {
  return (
    <main className="landing-shell">
      <section className="landing-hero auth-choice-hero">
        <div className="role-choice-intro">
          <div className="badge purple">Welcome to Quizly</div>
          <h1>Sign in or create an account</h1>
          <p className="muted">Use your Quizly account to continue to your dashboard.</p>
        </div>

        <div className="auth-choice-grid">
          <Link className="card pad auth-choice-card" href="/login">
            <div className="icon-tile purple"><LogIn size={24} /></div>
            <div>
              <h2>Sign in</h2>
              <p className="muted small">Already have an account? Continue with your email and password.</p>
            </div>
            <span className="btn primary full">Sign in</span>
          </Link>
          <Link className="card pad auth-choice-card" href="/register">
            <div className="icon-tile blue"><UserPlus size={24} /></div>
            <div>
              <h2>Create account</h2>
              <p className="muted small">Choose your role, then register with email and password.</p>
            </div>
            <span className="btn full">Create account</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
