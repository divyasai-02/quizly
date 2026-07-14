import { NotificationType, UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  notificationCreate,
  notificationCreateMany,
  notificationFindMany,
  notificationCount,
  notificationFindFirst,
  notificationUpdate,
  notificationUpdateMany,
  userFindMany
} = vi.hoisted(() => ({
  notificationCreate: vi.fn(),
  notificationCreateMany: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationCount: vi.fn(),
  notificationFindFirst: vi.fn(),
  notificationUpdate: vi.fn(),
  notificationUpdateMany: vi.fn(),
  userFindMany: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: notificationCreate,
      createMany: notificationCreateMany,
      findMany: notificationFindMany,
      count: notificationCount,
      findFirst: notificationFindFirst,
      update: notificationUpdate,
      updateMany: notificationUpdateMany
    },
    user: {
      findMany: userFindMany
    }
  }
}));

import {
  createNotification,
  createRoleNotifications,
  listNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/services/notificationService";

describe("notificationService", () => {
  beforeEach(() => {
    notificationCreate.mockReset();
    notificationCreateMany.mockReset();
    notificationFindMany.mockReset();
    notificationCount.mockReset();
    notificationFindFirst.mockReset();
    notificationUpdate.mockReset();
    notificationUpdateMany.mockReset();
    userFindMany.mockReset();
  });

  it("creates a notification", async () => {
    notificationCreate.mockResolvedValue({
      id: "notif-1",
      userId: "prof-1",
      role: UserRole.PROFESSOR,
      context: "quiz-builder",
      type: NotificationType.AI_QUIZ_GENERATED,
      title: "AI quiz ready",
      message: "Review your generated quiz draft.",
      read: false,
      actionUrl: "/professor/create-quiz",
      createdAt: new Date("2026-07-10T10:00:00.000Z")
    });

    const created = await createNotification({
      userId: "prof-1",
      role: UserRole.PROFESSOR,
      type: NotificationType.AI_QUIZ_GENERATED,
      title: "AI quiz ready",
      message: "Review your generated quiz draft.",
      context: "quiz-builder",
      actionUrl: "/professor/create-quiz"
    });

    expect(created.id).toBe("notif-1");
    expect(notificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "prof-1", role: UserRole.PROFESSOR })
    }));
  });

  it("returns unread count with latest notifications", async () => {
    notificationFindMany.mockResolvedValue([
      {
        id: "notif-1",
        userId: "student-1",
        role: UserRole.STUDENT,
        context: null,
        type: NotificationType.RESULT_AVAILABLE,
        title: "Results available",
        message: "Your quiz results are ready.",
        read: false,
        actionUrl: "/quiz/javascript-basics/results",
        createdAt: new Date("2026-07-10T10:00:00.000Z")
      }
    ]);
    notificationCount.mockResolvedValue(3);

    const result = await listNotificationsForUser("student-1", UserRole.STUDENT, { limit: 5 });

    expect(result.unreadCount).toBe(3);
    expect(result.notifications).toHaveLength(1);
    expect(notificationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "student-1", role: UserRole.STUDENT },
      take: 5
    }));
  });

  it("marks one notification as read", async () => {
    notificationFindFirst.mockResolvedValue({
      id: "notif-1",
      userId: "admin-1",
      role: UserRole.ADMIN
    });
    notificationUpdate.mockResolvedValue({
      id: "notif-1",
      userId: "admin-1",
      role: UserRole.ADMIN,
      context: "moderation",
      type: NotificationType.ADMIN_LOW_CONFIDENCE_AI_GENERATION,
      title: "Low-confidence AI draft",
      message: "Review the flagged AI generation.",
      read: true,
      actionUrl: "/admin/ai-moderation",
      createdAt: new Date("2026-07-10T10:00:00.000Z")
    });

    const updated = await markNotificationRead("notif-1", "admin-1", UserRole.ADMIN);

    expect(updated.read).toBe(true);
    expect(notificationFindFirst).toHaveBeenCalledWith({ where: { id: "notif-1", userId: "admin-1", role: UserRole.ADMIN } });
  });

  it("respects role filtering when marking all as read", async () => {
    notificationUpdateMany.mockResolvedValue({ count: 4 });
    notificationFindMany.mockResolvedValue([]);
    notificationCount.mockResolvedValue(0);

    const result = await markAllNotificationsRead("prof-1", UserRole.PROFESSOR);

    expect(notificationUpdateMany).toHaveBeenCalledWith({
      where: { userId: "prof-1", role: UserRole.PROFESSOR, read: false },
      data: { read: true }
    });
    expect(result.unreadCount).toBe(0);
  });

  it("creates role-wide notifications for matching users only", async () => {
    userFindMany.mockResolvedValue([{ id: "student-1" }, { id: "student-2" }]);
    notificationCreateMany.mockResolvedValue({ count: 2 });

    const result = await createRoleNotifications(UserRole.STUDENT, {
      type: NotificationType.NEW_QUIZ_ASSIGNED,
      title: "New quiz assigned",
      message: "A new quiz is waiting in your classroom.",
      actionUrl: "/student/classroom"
    });

    expect(userFindMany).toHaveBeenCalledWith({ where: { role: UserRole.STUDENT }, select: { id: true } });
    expect(notificationCreateMany).toHaveBeenCalled();
    expect(result.count).toBe(2);
  });
});
