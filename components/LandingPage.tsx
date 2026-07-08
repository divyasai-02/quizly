"use client";

import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { demoUsers, getRoleHome, setDemoUser } from "@/lib/demoSession";

const roleCards = [
  {
    role: "professor" as const,
    title: "Continue as Professor",
    text: "Manage classes, create quizzes, review analytics, and use Quizly's teaching tools."
  },
  {
    role: "student" as const,
    title: "Continue as Student",
    text: "Take assigned quizzes, track progress, and focus your next study session."
  },
  {
    role: "admin" as const,
    title: "Continue as Admin",
    text: "Oversee subjects, users, class health, and the broader platform experience."
  }
];

const roleIcons = {
  professor: Sparkles,
  student: Users,
  admin: ShieldCheck
} as const;

export function LandingPage() {
  const router = useRouter();

  function handleContinue(role: keyof typeof demoUsers) {
    setDemoUser(role);
    router.push(getRoleHome(role));
    router.refresh();
  }

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <Badge tone="purple">Demo login</Badge>
        <h1>Choose the Quizly role you want to explore.</h1>
        <p className="muted">
          This phase uses seeded demo accounts so you can move through the correct dashboard, routes, sidebar, and permissions without full password auth yet.
        </p>
        <div className="landing-grid">
          {roleCards.map(({ role, title, text }) => {
            const user = demoUsers[role];
            const Icon = roleIcons[role];
            return (
              <button className="landing-card" key={role} onClick={() => handleContinue(role)} type="button">
                <div className="landing-card-top">
                  <div className="icon-tile purple">
                    <Icon size={24} />
                  </div>
                  <Badge tone={role === "student" ? "green" : role === "admin" ? "amber" : "purple"}>{user.title}</Badge>
                </div>
                <h2>{title}</h2>
                <p className="muted">{text}</p>
                <div className="landing-user">
                  <div className="avatar">{user.initials}</div>
                  <div>
                    <strong>{user.name}</strong>
                    <div className="muted small">{user.email}</div>
                  </div>
                </div>
                <span className="btn primary">
                  Enter workspace
                  <ArrowRight size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
