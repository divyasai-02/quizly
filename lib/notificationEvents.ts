"use client";

export const NOTIFICATIONS_CHANGED_EVENT = "quizly:notifications-changed";

export function emitNotificationsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_CHANGED_EVENT));
}
