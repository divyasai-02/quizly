import { describe, expect, it } from "vitest";
import { getRoleHome, resolveDemoUser } from "./demoSession";

describe("demo session helpers", () => {
  it("resolves seeded users from cookie values", () => {
    expect(resolveDemoUser("prof-john", "professor")?.name).toBe("Prof. John Doe");
    expect(resolveDemoUser("student-arjun", "student")?.roleKey).toBe("student");
    expect(resolveDemoUser("admin-demo", "admin")?.title).toBe("Admin");
  });

  it("falls back to role when only the role cookie is available", () => {
    expect(resolveDemoUser(undefined, "student")?.id).toBe("student-arjun");
  });

  it("maps each role to its dashboard home", () => {
    expect(getRoleHome("professor")).toBe("/professor/dashboard");
    expect(getRoleHome("student")).toBe("/student/dashboard");
    expect(getRoleHome("admin")).toBe("/admin/dashboard");
  });
});
