import { describe, expect, it } from "vitest";
import { mapAdminSummaryData, mapStudentDashboardData } from "./roleData";

describe("role data mapping", () => {
  it("builds student dashboard summary data", () => {
    const summary = mapStudentDashboardData({
      studentName: "Arjun Mehta",
      activeQuizCount: 3,
      enrolledClassCount: 2,
      attempts: [
        { score: 4, percentage: 100, topic: "JavaScript", quizTitle: "JS Basics", subject: "Web", status: "SUBMITTED", createdAt: new Date() },
        { score: 2, percentage: 50, topic: "DBMS", quizTitle: "DBMS Fundamentals", subject: "DBMS", status: "SUBMITTED", createdAt: new Date() }
      ]
    });

    expect(summary.studentName).toBe("Arjun Mehta");
    expect(summary.completedQuizCount).toBe(2);
    expect(summary.xp).toBe(600);
    expect(summary.level).toBe(2);
    expect(summary.weakTopics).toContain("DBMS");
  });

  it("builds admin stat cards from platform counts", () => {
    const stats = mapAdminSummaryData({
      totalUsers: 10,
      professorCount: 2,
      studentCount: 7,
      classCount: 4,
      quizCount: 12,
      activeQuizCount: 5
    });

    expect(stats[0]).toMatchObject({ label: "Total Users", value: "10" });
    expect(stats[5]).toMatchObject({ label: "Active Quizzes", value: "5" });
  });
});
