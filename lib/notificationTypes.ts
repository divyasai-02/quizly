import type { NotificationType, UserRole } from "@prisma/client";

export type NotificationItem = {
  id: string;
  userId: string;
  role: UserRole;
  context: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};
