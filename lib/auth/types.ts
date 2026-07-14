import type { DemoRoleKey, DemoUserRole } from "@/lib/demoSession";

export type AppSessionUser = {
  avatarUrl?: string | null;
  email: string;
  id: string;
  initials: string;
  name: string;
  role: DemoUserRole;
  roleKey: DemoRoleKey;
  subtitle: string;
  title: string;
};
