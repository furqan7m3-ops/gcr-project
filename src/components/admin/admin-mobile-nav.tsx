"use client";

import Image from "next/image";

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
      <SheetContent
        side="left"
        className="w-72 gap-6 border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif text-sidebar-accent-foreground">
            <Image src="/brand/logo.png" alt="" width={32} height={32} className="h-7 w-7" />
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
