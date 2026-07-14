import type { AppSessionUser } from "@/lib/auth/types";

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentUser() {
  const payload = await authRequest<{ user: AppSessionUser | null }>("/api/auth/me", {
    cache: "no-store"
  });
  return payload.user;
}

export async function refreshSession() {
  return getCurrentUser();
}

export async function login(input: { email: string; password: string }) {
  return authRequest<{ user: AppSessionUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function register(input: {
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
  role: "STUDENT" | "PROFESSOR";
}) {
  return authRequest<{ user: AppSessionUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function logout() {
  return authRequest<{ success: true }>("/api/auth/logout", {
    method: "POST"
  });
}
