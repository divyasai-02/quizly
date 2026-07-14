"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";

export default function StudentSettingsPage() {
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
      setNotice("Student settings saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Settings update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Manage your learning preferences and account experience.">
      <div className="content grid grid-2">
        {error ? <div className="notice">{error}</div> : null}
        {notice ? <div className="notice success">{notice}</div> : null}
        <section className="card pad">
          <h2>Study Preferences</h2>
          <label><strong>Quiz reminders</strong><select className="select" value={settings?.quizReminders ?? "Enabled"} onChange={(event) => setSettings((current: any) => ({ ...current, quizReminders: event.target.value }))}><option>Enabled</option><option>Disabled</option></select></label>
          <label><strong>Leaderboard visibility</strong><select className="select" value={settings?.leaderboardVisibility ?? "Public to class"} onChange={(event) => setSettings((current: any) => ({ ...current, leaderboardVisibility: event.target.value }))}><option>Public to class</option><option>Private</option></select></label>
          <label><strong>AI study suggestions</strong><select className="select" value={settings?.aiStudySuggestions ?? "Enabled"} onChange={(event) => setSettings((current: any) => ({ ...current, aiStudySuggestions: event.target.value }))}><option>Enabled</option><option>Disabled</option></select></label>
          <button className="btn primary" onClick={saveSettings} disabled={saving || !settings} type="button">{saving ? "Saving..." : "Save Study Preferences"}</button>
        </section>
        <section className="card pad">
          <h2>Experience</h2>
          <label><strong>Theme</strong><select className="select" value={settings?.theme ?? "Quizly default"} onChange={(event) => setSettings((current: any) => ({ ...current, theme: event.target.value }))}><option>Quizly default</option><option>High contrast</option><option>Calm focus</option></select></label>
          <label><strong>Locale</strong><input className="input" value={settings?.locale ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, locale: event.target.value }))} /></label>
          <label><strong>Notifications</strong><select className="select" value={settings?.notifications ?? "In-app only"} onChange={(event) => setSettings((current: any) => ({ ...current, notifications: event.target.value }))}><option>In-app only</option><option>Muted</option></select></label>
          <button className="btn" onClick={saveSettings} disabled={saving || !settings} type="button">Save Experience</button>
        </section>
      </div>
    </AppShell>
  );
}
