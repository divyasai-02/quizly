import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/serverSession", () => ({
  getServerUser: vi.fn(async () => ({
    id: "student-arjun",
    name: "Arjun Mehta",
    email: "student@quizly.local",
    role: "STUDENT",
    roleKey: "student"
  }))
}));

describe("GET /api/auth/me", () => {
  it("returns the current user without password data", async () => {
    const response = await GET(new Request("http://localhost/api/auth/me"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.user.email).toBe("student@quizly.local");
    expect(body.user.passwordHash).toBeUndefined();
  });
});
