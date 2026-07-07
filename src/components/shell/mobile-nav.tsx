"use client";

import { GraduationCap } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import type { NavSection } from "./nav-config";
import { NavList } from "./nav-list";
import { useSidebar } from "./sidebar-context";

export function MobileNav({ sections }: { sections: NavSection[] }) {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 gap-6 lg:hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            GCR
          </SheetTitle>
        </SheetHeader>
        <div className="-mx-1 flex-1 overflow-y-auto">
          <NavList sections={sections} onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
