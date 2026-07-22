"use client";

import { ShieldCheck } from "lucide-react";

import { getVisibleSections } from "@/components/shell/nav-config";
import { NavList } from "@/components/shell/nav-list";
import { useSidebar } from "@/components/shell/sidebar-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserRole } from "@/generated/prisma/enums";

const sections = getVisibleSections(UserRole.ADMIN);

export function AdminMobileNav() {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 gap-6 lg:hidden">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            Admin
          </SheetTitle>
        </SheetHeader>
        <div className="-mx-1 flex-1 overflow-y-auto">
          <NavList sections={sections} onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
