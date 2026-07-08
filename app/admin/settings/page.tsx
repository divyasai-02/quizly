import { AppShell } from "@/components/AppShell";

export default function AdminSettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Control platform branding, moderation placeholders, and global preferences.">
      <div className="content grid grid-2">
        <section className="card pad">
          <h2>Platform Branding</h2>
          <div className="settings-row"><span>Brand Name</span><strong>Quizly</strong></div>
          <div className="settings-row"><span>Locale</span><strong>English</strong></div>
          <div className="settings-row"><span>Theme</span><strong>Purple SaaS</strong></div>
        </section>
        <section className="card pad">
          <h2>Controls</h2>
          <div className="settings-row"><span>Role management</span><strong>Placeholder</strong></div>
          <div className="settings-row"><span>AI moderation settings</span><strong>Placeholder</strong></div>
          <div className="settings-row"><span>System notices</span><strong>In-app only</strong></div>
        </section>
      </div>
    </AppShell>
  );
}
