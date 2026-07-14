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
  registerUser: vi.fn()
}));

vi.mock("@/lib/auth/session", () => ({
  AUTH_COOKIE: "quizly-auth",
  createSessionToken: vi.fn(async () => "token-abc"),
  getAuthCookieOptions: vi.fn(() => ({ path: "/" }))
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    setMock.mockClear();
    deleteMock.mockClear();
  });

  it("registers successfully and sets the auth cookie", async () => {
    const { registerUser } = await import("@/lib/auth/service");
    vi.mocked(registerUser).mockResolvedValueOnce({
      id: "new-user",
      email: "new@quizly.local",
      name: "New User",
      role: "STUDENT",
      roleKey: "student",
      initials: "NU",
      title: "Student",
      subtitle: "Learner Account"
    });

    const response = await POST(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "New User",
        email: "new@quizly.local",
        password: "password123",
        confirmPassword: "password123",
        role: "STUDENT"
      })
    }));

    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.user.passwordHash).toBeUndefined();
    expect(setMock).toHaveBeenCalled();
  });

  it("returns duplicate email errors", async () => {
    const { registerUser } = await import("@/lib/auth/service");
    vi.mocked(registerUser).mockRejectedValueOnce(new AuthError("An account with that email already exists.", 409));

    const response = await POST(new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Existing User",
        email: "student@quizly.local",
        password: "password123",
        confirmPassword: "password123",
        role: "STUDENT"
      })
    }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: "An account with that email already exists." });
  });
});
