"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  FileQuestion,
  FileText,
  Flag,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  Medal,
  Menu,
  MonitorCog,
  NotebookTabs,
  PlusCircle,
  Puzzle,
  Search,
  SearchCheck,
  Settings,
  Trophy,
  UserCircle2,
  Users,
  X
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Badge } from "@/components/ui";
import { logout, refreshSession } from "@/lib/authClient";
import type { AppSessionUser } from "@/lib/auth/types";
import { getRoleLabel } from "@/lib/demoSession";
import { getSidebarItems } from "@/lib/sidebar";

const iconMap = {
  Dashboard: Home,
  Classes: GraduationCap,
  Quizzes: BookOpen,
  "Create Quiz": PlusCircle,
  Analytics: BarChart3,
  Students: Users,
  "Question Bank": FileQuestion,
  Templates: NotebookTabs,
  Reports: FileText,
  Settings: Settings,
  "Help & Support": CircleHelp,
  Classroom: GraduationCap,
  Leaderboards: Trophy,
  Achievements: Medal,
  "Study Room": SearchCheck,
  Profile: UserCircle2,
  Home: LayoutDashboard,
  Subjects: Puzzle,
  Users: Users,
  Integrations: Puzzle
} as const;

export function AppShell({
  children,
  title,
  subtitle
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    refreshSession()
      .then((payload) => {
        if (!cancelled) {
          setUser(payload ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const navItems = useMemo(() => getSidebarItems(user?.roleKey ?? "professor"), [user?.roleKey]);

  function runShellSearch() {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    const match = navItems.find((item) => item.label.toLowerCase().includes(query) || item.href.toLowerCase().includes(query));
    if (match) {
      setSearchMessage(null);
      setSearchQuery("");
      router.push(match.href);
      return;
    }
    setSearchMessage("No matching page in this role.");
  }

  async function handleLogout() {
    await logout().catch(() => null);
    window.location.assign("/");
  }

  async function handleSwitchRole() {
    setMenuOpen(false);
    await logout().catch(() => null);
    window.location.assign("/");
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <Link className="brand" href={navItems[0]?.href ?? "/"}>
            <Trophy size={34} fill="currentColor" />
            Quizly
          </Link>
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(false)} type="button" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {user ? (
          <div className="profile-card">
            <div className="avatar">{user.initials}</div>
            <div className="profile-meta">
              <strong>{user.name}</strong>
              <span>{user.subtitle}</span>
            </div>
            <Badge tone={user.roleKey === "student" ? "green" : user.roleKey === "admin" ? "amber" : "purple"}>{getRoleLabel(user.role)}</Badge>
          </div>
        ) : null}

        <nav className="nav">
          {navItems.map((item, index) => {
            const Icon = iconMap[item.label as keyof typeof iconMap] ?? MonitorCog;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`nav-link ${active ? (index === 0 ? "primary-active" : "active") : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}

          <div className="nav-section">
            <button className="nav-link" onClick={handleLogout} type="button">
              <LogOut size={20} />
              Logout
            </button>
            <button className="nav-link" onClick={handleSwitchRole} type="button">
              <Flag size={20} />
              Switch Demo Role
            </button>
          </div>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} type="button" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="page-title">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <label className="search">
            <Search size={18} />
            <input
              placeholder="Search pages, classes, users..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSearchMessage(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") runShellSearch();
              }}
            />
          </label>
          {searchMessage ? <span className="muted small">{searchMessage}</span> : null}
          {user ? <NotificationBell user={user} pathname={pathname} /> : null}
          {user ? (
            <div className="topbar-user">
              <div className="topbar-user-meta">
                <strong>{user.name}</strong>
                <span>{getRoleLabel(user.role)}</span>
              </div>
              <div className="avatar-sm">{user.initials.slice(0, 1)}</div>
            </div>
          ) : null}
        </header>
        {menuOpen ? <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} type="button" aria-label="Close sidebar" /> : null}
        {children}
      </main>
    </div>
  );
}
