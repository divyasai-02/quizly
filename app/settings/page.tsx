import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Manage profile, quiz defaults, and notifications.">
      <div className="content grid grid-2">
        <section className="card pad">
          <h2>Profile</h2>
          <label className="small muted">Display name</label>
          <input className="input" defaultValue="Prof. John Doe" />
          <br /><br />
          <label className="small muted">Department</label>
          <input className="input" defaultValue="Computer Science" />
          <br /><br />
          <button className="btn primary">Save Changes</button>
        </section>
        <section className="card pad">
          <h2>Quiz Defaults</h2>
          <div className="settings-row"><span>Auto-save drafts</span><strong>Enabled</strong></div>
          <div className="settings-row"><span>Shuffle options</span><strong>Optional</strong></div>
          <div className="settings-row"><span>Result visibility</span><strong>After submit</strong></div>
        </section>
      </div>
    </AppShell>
  );
}
