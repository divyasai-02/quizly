"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, EmptyState, SkeletonCard } from "@/components/ui";
import { notificationsApi } from "@/lib/apiClient";
import type { NotificationItem } from "@/lib/notificationTypes";
import { NOTIFICATIONS_CHANGED_EVENT, emitNotificationsChanged } from "@/lib/notificationEvents";
import type { DemoRoleKey } from "@/lib/demoSession";

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

const subtitles: Record<DemoRoleKey, string> = {
  professor: "Track AI activity, student signals, and report-ready events in one place.",
  student: "Stay on top of assignments, results, practice nudges, and achievements.",
  admin: "Monitor platform activity, AI risks, and account events across the workspace."
};

export function NotificationsPage({ roleKey }: { roleKey: DemoRoleKey }) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications() {
    setLoading(true);

    try {
      const data = await notificationsApi.list();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void notificationsApi.list()
      .then((data) => {
        if (cancelled) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        if (cancelled) return;
        setNotifications([]);
        setUnreadCount(0);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    function handleNotificationsChanged() {
      void loadNotifications();
    }

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    };
  }, [roleKey]);

  async function markRead(id: string) {
    const updated = await notificationsApi.markRead(id);
    setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    emitNotificationsChanged();
  }

  async function markAllRead() {
    const next = await notificationsApi.markAllRead();
    setNotifications(next.notifications);
    setUnreadCount(next.unreadCount);
    emitNotificationsChanged();
  }

  const homeHref = roleKey === "student" ? "/student/dashboard" : roleKey === "admin" ? "/admin/dashboard" : "/professor/dashboard";

  return (
    <AppShell title="Notifications" subtitle={subtitles[roleKey]}>
      <div className="content grid">
        <section className="card pad">
          <div className="section-head">
            <div>
              <h2>Inbox</h2>
              <p className="muted small">Unread notifications update the topbar bell and can link back to important workflows.</p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Badge tone={unreadCount > 0 ? "pink" : "green"}>{unreadCount > 0 ? `${unreadCount} unread` : "All read"}</Badge>
              {unreadCount > 0 ? <button className="btn" onClick={markAllRead} type="button"><CheckCheck size={16} />Mark all read</button> : null}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-2">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : notifications.length ? (
          <section className="grid">
            {notifications.map((notification) => (
              <article className={`card pad notification-page-item ${notification.read ? "read" : "unread"}`} key={notification.id}>
                <div className="section-head">
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0 }}>{notification.title}</h3>
                      {!notification.read ? <Badge tone="pink">Unread</Badge> : <Badge tone="green">Read</Badge>}
                    </div>
                    <p className="muted small">{relativeTime(notification.createdAt)}</p>
                  </div>
                  <Badge tone="blue">{notification.type.replaceAll("_", " ")}</Badge>
                </div>

                <p className="muted">{notification.message}</p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {notification.actionUrl ? <Link className="btn primary" href={notification.actionUrl}>Open Related Action</Link> : <Link className="btn primary" href={homeHref}>Back to Dashboard</Link>}
                  {!notification.read ? <button className="btn" onClick={() => markRead(notification.id)} type="button"><Bell size={16} />Mark as Read</button> : null}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState title="No notifications yet" text="Important events will appear here once your role has activity to review." />
        )}
      </div>
    </AppShell>
  );
}
