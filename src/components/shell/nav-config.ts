import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Home,
  LayoutDashboard,
  LockKeyhole,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from "lucide-react";

import { UserRole } from "@/generated/prisma/enums";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. Omit to show it to everyone. */
  roles?: UserRole[];
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/dashboard", icon: Home },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Calendar", href: "/calendar", icon: Calendar },
      {
        label: "To-do",
        href: "/todo",
        icon: ClipboardCheck,
        roles: [UserRole.STUDENT],
      },
      {
        label: "To review",
        href: "/review",
        icon: ClipboardList,
        roles: [UserRole.TEACHER, UserRole.ADMIN],
      },
      { label: "Classes", href: "/classes", icon: BookOpen },
      { label: "Archived classes", href: "/archived", icon: Archive },
    ],
  },
  {
    label: "Admin",
    items: [
      // Distinct from "Home" above (/dashboard, the same teacher-style
      // overview admins get when browsing outside /admin) - this is the
      // platform-stats dashboard, previously only reachable via the now-
      // retired separate admin-only sidebar.
      {
        label: "Admin Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        roles: [UserRole.ADMIN],
      },
      { label: "Users", href: "/admin/users", icon: Users, roles: [UserRole.ADMIN] },
      {
        label: "Classrooms",
        href: "/admin/classrooms",
        icon: ShieldCheck,
        roles: [UserRole.ADMIN],
      },
      {
        label: "Moderation",
        href: "/admin/moderation",
        icon: ShieldAlert,
        roles: [UserRole.ADMIN],
      },
      { label: "Reports", href: "/admin/reports", icon: BarChart3, roles: [UserRole.ADMIN] },
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ScrollText,
        roles: [UserRole.ADMIN],
      },
      {
        label: "Security",
        href: "/admin/security",
        icon: LockKeyhole,
        roles: [UserRole.ADMIN],
      },
      // Distinct from the personal "Settings" item below (/settings, account
      // details/password) - this is platform-wide configuration, previously
      // only reachable via the now-retired separate admin-only sidebar.
      {
        label: "Platform Settings",
        href: "/admin/settings",
        icon: SlidersHorizontal,
        roles: [UserRole.ADMIN],
      },
    ],
  },
  {
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function getVisibleSections(role: UserRole): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}
