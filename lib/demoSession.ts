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
    email: "johndoe@university.edu",
    initials: "PJ",
    role: "PROFESSOR",
    roleKey: "professor",
    title: "Professor",
    subtitle: "Computer Science"
  },
  student: {
    id: "student-arjun",
    name: "Arjun Mehta",
    email: "arjun@student.edu",
    initials: "AM",
    role: "STUDENT",
    roleKey: "student",
    title: "Student",
    subtitle: "CSE - A"
  },
  admin: {
    id: "admin-demo",
    name: "Admin",
    email: "admin@quizly.test",
    initials: "AD",
    role: "ADMIN",
    roleKey: "admin",
    title: "Admin",
    subtitle: "Platform Operations"
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

function persistCookies(user: DemoUserSession) {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${DEMO_SESSION_COOKIE}=${encodeURIComponent(user.id)}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${DEMO_ROLE_COOKIE}=${encodeURIComponent(user.roleKey)}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const cookieMap = new Map(
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [key, ...rest] = entry.split("=");
        return [key, decodeURIComponent(rest.join("="))] as const;
      })
  );

  const cookieUser = resolveDemoUser(cookieMap.get(DEMO_SESSION_COOKIE), cookieMap.get(DEMO_ROLE_COOKIE));
  if (cookieUser) {
    window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(cookieUser));
    return cookieUser;
  }

  const stored = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as DemoUserSession;
      const resolved = resolveDemoUser(parsed.id, parsed.roleKey);
      if (resolved) return resolved;
    } catch {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
    }
  }

  return null;
}

export function getCurrentRole() {
  return getCurrentUser()?.roleKey ?? null;
}

export function setDemoUser(input: DemoRoleKey | DemoUserSession) {
  if (typeof window === "undefined") {
    return null;
  }

  const user = typeof input === "string" ? demoUsers[input] : input;
  window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
  persistCookies(user);
  return user;
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_SESSION_KEY);
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${DEMO_ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
