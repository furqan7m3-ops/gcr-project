"use client";

import Image from "next/image";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import type { NavSection } from "./nav-config";
import { NavList } from "./nav-list";
import { useSidebar } from "./sidebar-context";

export function MobileNav({
  sections,
  platformName,
}: {
  sections: NavSection[];
  platformName?: string;
}) {
  const { isMobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent
        side="left"
        className="w-72 gap-6 border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-8 font-serif text-sm leading-tight text-sidebar-accent-foreground">
            <Image
              src="/brand/logo.png"
              alt=""
              width={32}
              height={32}
              className="h-7 w-7 shrink-0"
            />
            {platformName ?? "Elevate Institute of Tourism & Hospitality Management"}
          </SheetTitle>
        </SheetHeader>
        <div className="-mx-1 flex-1 overflow-y-auto">
          <NavList sections={sections} onNavigate={() => setMobileOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
