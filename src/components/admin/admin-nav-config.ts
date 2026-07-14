import type { LucideIcon } from "lucide-react";
import { BarChart3, LayoutDashboard, School, Settings, Users } from "lucide-react";

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
  { label: "Classrooms", href: "/admin/classrooms", icon: School, disabled: true },
  { label: "Reports", href: "/admin/reports", icon: BarChart3, disabled: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, disabled: true },
];
