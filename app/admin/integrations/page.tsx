"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui";

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/integrations")
      .then((response) => response.json())
      .then((payload) => setIntegrations(payload.integrations))
      .catch(() => setError("Integrations failed to load."));
  }, []);

  async function saveIntegrations() {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(integrations)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Integration update failed.");
      setIntegrations(payload.integrations);
      setNotice("Integration settings saved.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Integration update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function testWebhook() {
    setTesting(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/integrations", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Webhook test failed.");
      setNotice(`Webhook test completed with HTTP ${payload.status}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Webhook test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <AppShell title="Integrations" subtitle="Configure institution-level data and notification integration points.">
      <div className="content grid grid-2">
        {error ? <div className="notice">{error}</div> : null}
        {notice ? <div className="notice success">{notice}</div> : null}

        <section className="card pad">
          <div className="section-head">
            <h2>Webhook</h2>
            <Badge tone={integrations?.webhookEnabled === "true" ? "green" : "amber"}>{integrations?.webhookEnabled === "true" ? "Enabled" : "Disabled"}</Badge>
          </div>
          <label><strong>Webhook URL</strong><input className="input" value={integrations?.webhookUrl ?? ""} onChange={(event) => setIntegrations((current: any) => ({ ...current, webhookUrl: event.target.value }))} placeholder="https://example.com/webhook" /></label>
          <label><strong>Status</strong><select className="select" value={integrations?.webhookEnabled ?? "false"} onChange={(event) => setIntegrations((current: any) => ({ ...current, webhookEnabled: event.target.value }))}><option value="false">Disabled</option><option value="true">Enabled</option></select></label>
          <div className="toolbar-inline">
            <button className="btn primary" onClick={saveIntegrations} disabled={saving || !integrations} type="button">{saving ? "Saving..." : "Save Webhook"}</button>
            <button className="btn" onClick={testWebhook} disabled={testing || !integrations || integrations.webhookEnabled !== "true"} type="button">{testing ? "Testing..." : "Send Test Event"}</button>
          </div>
        </section>

        <section className="card pad">
          <h2>Data Providers</h2>
          <label><strong>SIS provider</strong><input className="input" value={integrations?.sisProvider ?? ""} onChange={(event) => setIntegrations((current: any) => ({ ...current, sisProvider: event.target.value }))} /></label>
          <label><strong>LMS provider</strong><input className="input" value={integrations?.lmsProvider ?? ""} onChange={(event) => setIntegrations((current: any) => ({ ...current, lmsProvider: event.target.value }))} /></label>
          <label><strong>Notification channel</strong><select className="select" value={integrations?.notificationChannel ?? "In-app"} onChange={(event) => setIntegrations((current: any) => ({ ...current, notificationChannel: event.target.value }))}><option>In-app</option><option>Webhook</option><option>In-app + Webhook</option></select></label>
          <button className="btn primary" onClick={saveIntegrations} disabled={saving || !integrations} type="button">Save Providers</button>
        </section>
      </div>
    </AppShell>
  );
}
