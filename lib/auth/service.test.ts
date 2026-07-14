import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "./password";
import { authenticateUser, AuthError, registerUser, validateLoginInput, validateRegistrationInput } from "./service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock("./password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn()
}));

describe("auth service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates registration input and blocks public admin signup", () => {
    expect(() => validateRegistrationInput({
      name: "Admin User",
      email: "admin@quizly.local",
      password: "password123",
      confirmPassword: "password123",
      role: "ADMIN"
    })).toThrow("Choose either Student or Professor for registration.");
  });

  it("validates login input", () => {
    expect(() => validateLoginInput({ email: "bad", password: "short" })).toThrow("Enter a valid email address.");
  });

  it("rejects duplicate registration emails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: "existing-user" } as never);

    await expect(registerUser({
      name: "Arjun",
      email: "student@quizly.local",
      password: "password123",
      confirmPassword: "password123",
      role: "STUDENT"
    })).rejects.toMatchObject({ message: "An account with that email already exists.", status: 409 });
  });

  it("hashes passwords and returns a safe user on registration", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(hashPassword).mockResolvedValueOnce("hashed-password");
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "new-user",
      name: "New Professor",
      email: "prof@quizly.local",
      role: "PROFESSOR",
      avatarUrl: null
    } as never);

    const user = await registerUser({
      name: "New Professor",
      email: "prof@quizly.local",
      password: "password123",
      confirmPassword: "password123",
      role: "PROFESSOR"
    });

    expect(hashPassword).toHaveBeenCalledWith("password123");
    expect(user).toMatchObject({
      id: "new-user",
      email: "prof@quizly.local",
      role: "PROFESSOR",
      roleKey: "professor",
      title: "Professor"
    });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("logs in with a valid password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "student-arjun",
      name: "Arjun Mehta",
      email: "student@quizly.local",
      role: "STUDENT",
      avatarUrl: null,
      passwordHash: "hashed"
    } as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(true);

    const user = await authenticateUser({ email: "student@quizly.local", password: "password123" });

    expect(user).toMatchObject({
      id: "student-arjun",
      roleKey: "student",
      title: "Student"
    });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejects invalid login credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "student-arjun",
      name: "Arjun Mehta",
      email: "student@quizly.local",
      role: "STUDENT",
      avatarUrl: null,
      passwordHash: "hashed"
    } as never);
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);

    await expect(authenticateUser({ email: "student@quizly.local", password: "password123" })).rejects.toMatchObject({
      message: "Invalid email or password.",
      status: 401
    });
  });
});
