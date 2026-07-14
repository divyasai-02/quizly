import type { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getRoleLabel, roleKeyFromUserRole, type DemoRoleKey, type DemoUserRole } from "@/lib/demoSession";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { AppSessionUser } from "@/lib/auth/types";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildSubtitle(role: UserRole) {
  if (role === "ADMIN") return "Platform Operations";
  if (role === "STUDENT") return "Learner Account";
  return "Teaching Account";
}

export function buildSessionUser(user: Pick<User, "avatarUrl" | "email" | "id" | "name" | "role">): AppSessionUser {
  const role = user.role as DemoUserRole;
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "Q";

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    initials,
    role,
    roleKey: roleKeyFromUserRole(role),
    title: getRoleLabel(role),
    subtitle: buildSubtitle(user.role)
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validatePassword(password: string) {
  if (password.trim().length < 8) {
    throw new AuthError("Password must be at least 8 characters long.");
  }
}

export function validateRegistrationInput(input: {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
  role?: string;
}) {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const password = input.password ?? "";
  const role = input.role?.trim().toUpperCase() ?? "";

  if (name.length < 2) {
    throw new AuthError("Name must be at least 2 characters long.");
  }
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError("Enter a valid email address.");
  }
  validatePassword(password);
  if (input.confirmPassword !== undefined && password !== input.confirmPassword) {
    throw new AuthError("Passwords do not match.");
  }
  if (role !== "STUDENT" && role !== "PROFESSOR") {
    throw new AuthError("Choose either Student or Professor for registration.");
  }

  return {
    name,
    email: normalizeEmail(email),
    password,
    role: role as "STUDENT" | "PROFESSOR"
  };
}

export function validateLoginInput(input: { email?: string; password?: string }) {
  const email = input.email?.trim() ?? "";
  const password = input.password ?? "";

  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError("Enter a valid email address.");
  }
  validatePassword(password);

  return {
    email: normalizeEmail(email),
    password
  };
}

export async function registerUser(input: {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
  role?: string;
}) {
  const validated = validateRegistrationInput(input);
  const existing = await prisma.user.findUnique({
    where: { email: validated.email }
  });

  if (existing) {
    throw new AuthError("An account with that email already exists.", 409);
  }

  const user = await prisma.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      passwordHash: await hashPassword(validated.password),
      role: validated.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true
    }
  });

  return buildSessionUser(user);
}

export async function authenticateUser(input: { email?: string; password?: string }) {
  const validated = validateLoginInput(input);
  const user = await prisma.user.findUnique({
    where: { email: validated.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      disabledAt: true,
      passwordHash: true
    }
  });

  if (!user || !(await verifyPassword(validated.password, user.passwordHash))) {
    throw new AuthError("Invalid email or password.", 401);
  }
  if (user.disabledAt) {
    throw new AuthError("This account has been deactivated. Contact an administrator.", 403);
  }

  return buildSessionUser(user);
}

export async function findUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      disabledAt: true
    }
  });

  return user && !user.disabledAt ? buildSessionUser(user) : null;
}
