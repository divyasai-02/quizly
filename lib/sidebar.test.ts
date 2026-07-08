import { describe, expect, it } from "vitest";
import { getSidebarItems } from "./sidebar";

describe("role sidebar config", () => {
  it("returns the professor navigation set", () => {
    expect(getSidebarItems("professor").map((item) => item.label)).toEqual([
      "Dashboard",
      "Classes",
      "Quizzes",
      "Create Quiz",
      "Analytics",
      "Students",
      "Question Bank",
      "Templates",
      "Reports",
      "Settings",
      "Help & Support"
    ]);
  });

  it("returns the student navigation set", () => {
    expect(getSidebarItems("student").map((item) => item.href)).toContain("/student/study-room");
  });

  it("returns the admin navigation set", () => {
    expect(getSidebarItems("admin").map((item) => item.href)).toContain("/admin/users");
  });
});
