"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((payload) => setSettings(payload.settings))
      .catch(() => setError("Settings failed to load."));
  }, []);

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Settings update failed.");
      setSettings(payload.settings);
      setNotice("Platform settings saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Settings update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Settings" subtitle="Manage platform controls, moderation guardrails, and admin preferences.">
      <div className="content grid grid-2">
        {error ? <div className="notice">{error}</div> : null}
        {notice ? <div className="notice success">{notice}</div> : null}
        <section className="card pad">
          <h2>Platform Branding</h2>
          <label><strong>Brand Name</strong><input className="input" value={settings?.brandName ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, brandName: event.target.value }))} /></label>
          <label><strong>Locale</strong><input className="input" value={settings?.locale ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, locale: event.target.value }))} /></label>
          <label><strong>Theme</strong><input className="input" value={settings?.theme ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, theme: event.target.value }))} /></label>
          <label><strong>System notices</strong><input className="input" value={settings?.systemNotices ?? ""} onChange={(event) => setSettings((current: any) => ({ ...current, systemNotices: event.target.value }))} /></label>
          <button className="btn primary" onClick={saveSettings} disabled={saving || !settings} type="button">{saving ? "Saving..." : "Save Platform Settings"}</button>
        </section>
        <section className="card pad">
          <h2>Controls</h2>
          <div className="settings-row"><span>Role management</span><strong>Users directory</strong></div>
          <div className="settings-row"><span>AI moderation</span><strong>Moderation queue</strong></div>
          <div className="settings-row"><span>System notices</span><strong>{settings?.systemNotices ?? "In-app only"}</strong></div>
          <div className="toolbar-inline" style={{ marginTop: 16 }}>
            <Link className="btn primary" href="/admin/users">Open User Controls</Link>
            <Link className="btn" href="/admin/ai-moderation">Open AI Moderation</Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
