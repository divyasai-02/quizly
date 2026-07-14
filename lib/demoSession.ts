export type DemoRoleKey = "professor" | "student" | "admin";
export type DemoUserRole = "PROFESSOR" | "STUDENT" | "ADMIN";

export type DemoUserSession = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: DemoUserRole;
  roleKey: DemoRoleKey;
  title: string;
  subtitle: string;
};

export const DEMO_SESSION_KEY = "quizly-demo-user";
export const DEMO_SESSION_COOKIE = "quizly-demo-user";
export const DEMO_ROLE_COOKIE = "quizly-demo-role";

export const demoUsers: Record<DemoRoleKey, DemoUserSession> = {
  professor: {
    id: "prof-john",
    name: "Prof. John Doe",
    email: "professor@quizly.local",
    initials: "PJ",
    role: "PROFESSOR",
    roleKey: "professor",
    title: "Professor",
    subtitle: "Computer Science"
  },
  student: {
    id: "student-arjun",
    name: "Arjun Mehta",
    email: "student@quizly.local",
    initials: "AM",
    role: "STUDENT",
    roleKey: "student",
    title: "Student",
    subtitle: "CSE - A"
  },
  admin: {
    id: "admin-demo",
    name: "Admin",
    email: "admin@quizly.local",
    initials: "AD",
    role: "ADMIN",
    roleKey: "admin",
    title: "Admin",
    subtitle: "Platform Operations"
  }
};

export const demoLoginByRole: Record<DemoRoleKey, { email: string; password: string }> = {
  professor: {
    email: "professor@quizly.local",
    password: "password123"
  },
  student: {
    email: "student@quizly.local",
    password: "password123"
  },
  admin: {
    email: "admin@quizly.local",
    password: "password123"
  }
};

export function roleKeyFromUserRole(role: DemoUserRole): DemoRoleKey {
  if (role === "STUDENT") return "student";
  if (role === "ADMIN") return "admin";
  return "professor";
}

export function getRoleLabel(role: DemoUserRole | DemoRoleKey) {
  if (role === "STUDENT" || role === "student") return "Student";
  if (role === "ADMIN" || role === "admin") return "Admin";
  return "Professor";
}

export function getRoleHome(role: DemoRoleKey) {
  return role === "student"
    ? "/student/dashboard"
    : role === "admin"
      ? "/admin/dashboard"
      : "/professor/dashboard";
}

export function normalizeRoleKey(value?: string | null): DemoRoleKey | null {
  if (value === "student" || value === "admin" || value === "professor") return value;
  return null;
}

export function getDemoUserById(id?: string | null) {
  return Object.values(demoUsers).find((user) => user.id === id) ?? null;
}

export function resolveDemoUser(userId?: string | null, roleKey?: string | null) {
  const normalizedRole = normalizeRoleKey(roleKey);
  const byId = getDemoUserById(userId);

  if (byId && (!normalizedRole || byId.roleKey === normalizedRole)) {
    return byId;
  }

  if (normalizedRole) {
    return demoUsers[normalizedRole];
  }

  return null;
}
