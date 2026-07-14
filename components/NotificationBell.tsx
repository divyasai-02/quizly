"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui";
import { notificationsApi } from "@/lib/apiClient";
import type { AppSessionUser } from "@/lib/auth/types";
import { NOTIFICATIONS_CHANGED_EVENT, emitNotificationsChanged } from "@/lib/notificationEvents";
import type { NotificationItem } from "@/lib/notificationTypes";

function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function roleNotificationsUrl(user: AppSessionUser) {
  if (user.roleKey === "student") return "/student/notifications";
  if (user.roleKey === "admin") return "/admin/notifications";
  return "/professor/notifications";
}

export function NotificationBell({ user, pathname }: { user: AppSessionUser; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  async function loadNotifications() {
    setLoading(true);

    try {
      const data = await notificationsApi.list(6);
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

    void notificationsApi.list(6)
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

    return () => {
      cancelled = true;
    };
  }, [pathname, user.id]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleNotificationsChanged() {
      void loadNotifications();
    }

    document.addEventListener("mousedown", handleClick);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    };
  }, []);

  const bellLabel = useMemo(() => unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications", [unreadCount]);

  async function handleMarkRead(id: string) {
    const updated = await notificationsApi.markRead(id);
    setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
    setUnreadCount((current) => Math.max(0, current - 1));
    emitNotificationsChanged();
  }

  async function handleMarkAllRead() {
    const next = await notificationsApi.markAllRead();
    setNotifications(next.notifications);
    setUnreadCount(next.unreadCount);
    emitNotificationsChanged();
  }

  return (
    <div className="notification-wrap" ref={wrapperRef}>
      <button className="icon-button" aria-label={bellLabel} aria-expanded={open} onClick={() => setOpen((value) => !value)} type="button">
        <Bell size={20} />
        {unreadCount > 0 ? <span className="dot">{Math.min(99, unreadCount)}</span> : null}
      </button>

      {open ? (
        <div className="notification-dropdown card">
          <div className="notification-dropdown-head">
            <div>
              <strong>Notifications</strong>
              <div className="muted small">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {unreadCount > 0 ? <button className="linkish" onClick={handleMarkAllRead} type="button">Mark all read</button> : null}
              <Link className="linkish" href={roleNotificationsUrl(user)} onClick={() => setOpen(false)}>View all</Link>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty muted small">Loading notifications...</div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <div className={`notification-item ${notification.read ? "read" : "unread"}`} key={notification.id}>
                  <div className="notification-copy">
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <strong>{notification.title}</strong>
                      {!notification.read ? <Badge tone="pink">New</Badge> : null}
                    </div>
                    <p className="muted small">{notification.message}</p>
                    <div className="muted small">{relativeTime(notification.createdAt)}</div>
                  </div>
                  <div className="notification-actions">
                    {notification.actionUrl ? (
                      <Link className="linkish" href={notification.actionUrl} onClick={() => setOpen(false)}>Open</Link>
                    ) : null}
                    {!notification.read ? <button className="linkish" onClick={() => handleMarkRead(notification.id)} type="button">Read</button> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <strong>No notifications yet</strong>
                <p className="muted small">Important product events will appear here for your role.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
