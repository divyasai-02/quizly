import { NotificationType, UserRole } from "@prisma/client";
import type { NotificationListResponse, NotificationItem } from "@/lib/notificationTypes";
import { prisma } from "@/lib/prisma";
import type { DemoRoleKey } from "@/lib/demoSession";

export type CreateNotificationInput = {
  userId: string;
  role: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  context?: string;
  actionUrl?: string;
  read?: boolean;
};

function mapNotification(notification: {
  id: string;
  userId: string;
  role: UserRole;
  context: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: Date;
}): NotificationItem {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString()
  };
}

export function userRoleFromRoleKey(roleKey: DemoRoleKey): UserRole {
  if (roleKey === "student") return UserRole.STUDENT;
  if (roleKey === "admin") return UserRole.ADMIN;
  return UserRole.PROFESSOR;
}

export async function createNotification(input: CreateNotificationInput) {
  const created = await prisma.notification.create({
    data: {
      userId: input.userId,
      role: input.role,
      type: input.type,
      title: input.title,
      message: input.message,
      context: input.context,
      actionUrl: input.actionUrl,
      read: input.read ?? false
    }
  });

  return mapNotification(created);
}

export async function createNotifications(inputs: CreateNotificationInput[]) {
  if (!inputs.length) return { count: 0 };
  return prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      role: input.role,
      type: input.type,
      title: input.title,
      message: input.message,
      context: input.context,
      actionUrl: input.actionUrl,
      read: input.read ?? false
    }))
  });
}

export async function createRoleNotifications(
  role: UserRole,
  notification: Omit<CreateNotificationInput, "role" | "userId">
) {
  const users = await prisma.user.findMany({
    where: { role },
    select: { id: true }
  });

  return createNotifications(users.map((user) => ({
    userId: user.id,
    role,
    ...notification
  })));
}

export async function listNotificationsForUser(userId: string, role: UserRole, options?: { limit?: number }) {
  const where = { userId, role };
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit
    }),
    prisma.notification.count({
      where: { ...where, read: false }
    })
  ]);

  return {
    notifications: notifications.map(mapNotification),
    unreadCount
  } satisfies NotificationListResponse;
}

export async function markNotificationRead(id: string, userId: string, role: UserRole) {
  const existing = await prisma.notification.findFirst({
    where: { id, userId, role }
  });

  if (!existing) {
    throw new Error("Notification not found.");
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true }
  });

  return mapNotification(updated);
}

export async function markAllNotificationsRead(userId: string, role: UserRole) {
  await prisma.notification.updateMany({
    where: { userId, role, read: false },
    data: { read: true }
  });

  return listNotificationsForUser(userId, role);
}
