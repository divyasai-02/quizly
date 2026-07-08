import type { DemoRoleKey } from "@/lib/demoSession";

export type SidebarItem = {
  label: string;
  href: string;
};

export const sidebarByRole: Record<DemoRoleKey, SidebarItem[]> = {
  professor: [
    { label: "Dashboard", href: "/professor/dashboard" },
    { label: "Classes", href: "/professor/classes" },
    { label: "Quizzes", href: "/professor/quizzes" },
    { label: "Create Quiz", href: "/professor/create-quiz" },
    { label: "Analytics", href: "/professor/analytics" },
    { label: "Students", href: "/professor/students" },
    { label: "Question Bank", href: "/professor/question-bank" },
    { label: "Templates", href: "/professor/templates" },
    { label: "Reports", href: "/professor/reports" },
    { label: "Settings", href: "/professor/settings" },
    { label: "Help & Support", href: "/professor/help" }
  ],
  student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Classroom", href: "/student/classroom" },
    { label: "Leaderboards", href: "/student/leaderboards" },
    { label: "Achievements", href: "/student/achievements" },
    { label: "Study Room", href: "/student/study-room" },
    { label: "Profile", href: "/student/profile" },
    { label: "Settings", href: "/student/settings" }
  ],
  admin: [
    { label: "Home", href: "/admin/dashboard" },
    { label: "Classroom", href: "/admin/classroom" },
    { label: "Leaderboards", href: "/admin/leaderboards" },
    { label: "Subjects", href: "/admin/subjects" },
    { label: "Users", href: "/admin/users" },
    { label: "Settings", href: "/admin/settings" }
  ]
};

export function getSidebarItems(role: DemoRoleKey) {
  return sidebarByRole[role];
}
