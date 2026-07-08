import { AppShell } from "@/components/AppShell";

export default function StudentSettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Manage your learning preferences and account experience.">
      <div className="content grid grid-2">
        <section className="card pad">
          <h2>Study Preferences</h2>
          <div className="settings-row"><span>Quiz reminders</span><strong>Enabled</strong></div>
          <div className="settings-row"><span>Leaderboard visibility</span><strong>Public to class</strong></div>
          <div className="settings-row"><span>AI study suggestions</span><strong>Enabled</strong></div>
        </section>
        <section className="card pad">
          <h2>Experience</h2>
          <div className="settings-row"><span>Theme</span><strong>Quizly default</strong></div>
          <div className="settings-row"><span>Locale</span><strong>English</strong></div>
          <div className="settings-row"><span>Notifications</span><strong>In-app only</strong></div>
        </section>
      </div>
    </AppShell>
  );
}
