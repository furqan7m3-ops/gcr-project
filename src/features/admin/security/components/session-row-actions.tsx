"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { terminateSessionAction } from "../actions/security-mutations";
import type { ActiveSessionItem } from "../types";

export function SessionRowActions({ session }: { session: ActiveSessionItem }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await terminateSessionAction(session.id);

      if (result.status === "success") {
        toast.success(`Session for ${session.userName} terminated`);
      } else {
        toast.error(result.message);
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LogOut className="h-3.5 w-3.5" /> Terminate
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Terminate this session?"
        description={`${session.userName} will be signed out immediately and must sign in again.`}
        confirmLabel="Terminate"
        destructive
        pending={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
