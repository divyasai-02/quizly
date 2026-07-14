import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { AuthError } from "@/lib/auth/service";

const setMock = vi.fn();
const deleteMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    set: setMock,
    delete: deleteMock
  })
}));

vi.mock("@/lib/auth/service", () => ({
  AuthError: class AuthError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
  authenticateUser: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  AUTH_COOKIE: "quizly-auth",
  createSessionToken: vi.fn(async () => "token-123"),
  getAuthCookieOptions: vi.fn(() => ({ path: "/" }))
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    setMock.mockClear();
    deleteMock.mockClear();
  });

  it("logs in successfully and sets the auth cookie", async () => {
    const { authenticateUser } = await import("@/lib/auth/service");
    vi.mocked(authenticateUser).mockResolvedValueOnce({
      id: "prof-john",
      email: "professor@quizly.local",
      name: "Prof. John Doe",
      role: "PROFESSOR",
      roleKey: "professor",
      initials: "PJ",
      title: "Professor",
      subtitle: "Teaching Account"
    });

    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "professor@quizly.local", password: "password123" })
    }));

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.user.roleKey).toBe("professor");
    expect(body.user.passwordHash).toBeUndefined();
    expect(setMock).toHaveBeenCalled();
  });

  it("returns a safe login failure", async () => {
    const { authenticateUser } = await import("@/lib/auth/service");
    vi.mocked(authenticateUser).mockRejectedValueOnce(new AuthError("Invalid email or password.", 401));

    const response = await POST(new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "professor@quizly.local", password: "wrongpass123" })
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Invalid email or password." });
  });
});
