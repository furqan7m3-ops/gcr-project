"use client";

import * as React from "react";

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: React.ReactNode;
  /**
   * Pins the desktop sidebar permanently expanded and makes toggleCollapsed
   * a no-op - used by AdminShell so the mini/collapsed sidebar behavior is
   * disabled throughout the admin experience, without touching the default
   * (teacher/student) Shell, which mounts its own separate SidebarProvider
   * instance and is unaffected by this prop.
   */
  forceExpanded?: boolean;
}

export function SidebarProvider({ children, forceExpanded = false }: SidebarProviderProps) {
  const [isCollapsedState, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  const value = React.useMemo(
    () => ({
      isCollapsed: forceExpanded ? false : isCollapsedState,
      toggleCollapsed: () => {
        if (!forceExpanded) {
          setIsCollapsed((previous) => !previous);
        }
      },
      isMobileOpen,
      setMobileOpen: setIsMobileOpen,
    }),
    [forceExpanded, isCollapsedState, isMobileOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}
