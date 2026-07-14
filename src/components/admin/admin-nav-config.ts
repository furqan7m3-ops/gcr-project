import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  LockKeyhole,
  School,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Not yet implemented — rendered as a disabled "Soon" item instead of a link. */
  disabled?: boolean;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Classrooms", href: "/admin/classrooms", icon: School },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Security", href: "/admin/security", icon: LockKeyhole },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];
