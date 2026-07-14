"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((payload) => setSettings(payload.settings))
      .catch(() => setError("Settings failed to load."));
  }, []);

  async function saveSettings() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Settings update failed.");
      setSettings(payload.settings);
      setNotice("Professor settings saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Settings update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Manage professor profile details and quiz defaults.">
      <div className="content grid grid-2">
        {error ? <div className="notice">{error}</div> : null}
        {notice ? <div className="notice success">{notice}</div> : null}
        <section className="card pad">
          <h2>Profile</h2>
          <label><strong>Display name</strong><input className="input" value={settings?.displayName ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, displayName: event.target.value }))} /></label>
          <label><strong>Department</strong><input className="input" value={settings?.department ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, department: event.target.value }))} /></label>
          <button className="btn primary" onClick={saveSettings} disabled={saving || !settings} type="button">{saving ? "Saving..." : "Save Profile"}</button>
        </section>
        <section className="card pad">
          <h2>Quiz Defaults</h2>
          <label><strong>Auto-save drafts</strong><select className="select" value={settings?.autoSaveDrafts ?? "Enabled"} onChange={(event) => setSettings((current: any) => ({ ...current, autoSaveDrafts: event.target.value }))}><option>Enabled</option><option>Disabled</option></select></label>
          <label><strong>Shuffle options</strong><select className="select" value={settings?.shuffleOptions ?? "Optional"} onChange={(event) => setSettings((current: any) => ({ ...current, shuffleOptions: event.target.value }))}><option>Optional</option><option>Enabled by default</option><option>Disabled by default</option></select></label>
          <label><strong>Result visibility</strong><select className="select" value={settings?.resultVisibility ?? "After submit"} onChange={(event) => setSettings((current: any) => ({ ...current, resultVisibility: event.target.value }))}><option>After submit</option><option>After quiz closes</option><option>Professor review first</option></select></label>
          <label><strong>AI draft review</strong><select className="select" value={settings?.aiDraftReview ?? "Professor approval required"} onChange={(event) => setSettings((current: any) => ({ ...current, aiDraftReview: event.target.value }))}><option>Professor approval required</option><option>Allow reviewed AI drafts</option><option>Disable AI drafts</option></select></label>
          <button className="btn" onClick={saveSettings} disabled={saving || !settings} type="button">Save Defaults</button>
        </section>
      </div>
    </AppShell>
  );
}
