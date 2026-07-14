"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, MoreVertical, Unlock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemporaryPasswordDialog } from "@/features/admin/users/components/temporary-password-dialog";

import { forcePasswordResetAction, unlockAccountAction } from "../actions/security-mutations";
import type { LockedAccountItem } from "../types";

type ConfirmActionType = "unlock" | "reset";

export function LockedAccountRowActions({ account }: { account: LockedAccountItem }) {
  const router = useRouter();
  const [confirmType, setConfirmType] = useState<ConfirmActionType | null>(null);
  const [isPending, startTransition] = useTransition();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  function handleConfirm() {
    if (!confirmType) {
      return;
    }

    startTransition(async () => {
      if (confirmType === "unlock") {
        const result = await unlockAccountAction(account.id);
        if (result.status === "success") {
          toast.success(`${account.name} unlocked`);
        } else {
          toast.error(result.message);
        }
      } else {
        const result = await forcePasswordResetAction(account.id);
        if (result.status === "success") {
          toast.success(`Password reset for ${account.name}`);
          setTemporaryPassword(result.data.temporaryPassword);
        } else {
          toast.error(result.message);
        }
      }

      setConfirmType(null);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Actions for ${account.name}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setConfirmType("unlock")}>
            <Unlock /> Unlock account
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setConfirmType("reset")}>
            <KeyRound /> Force password reset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmType ? (
        <ConfirmDialog
          open={confirmType !== null}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmType(null);
            }
          }}
          title={
            confirmType === "unlock"
              ? `Unlock ${account.name}?`
              : `Force a password reset for ${account.name}?`
          }
          description={
            confirmType === "unlock"
              ? "This immediately restores sign-in access."
              : "Generates a new temporary password. They must set their own on next sign-in."
          }
          confirmLabel={confirmType === "unlock" ? "Unlock" : "Reset password"}
          pending={isPending}
          onConfirm={handleConfirm}
        />
      ) : null}

      {temporaryPassword ? (
        <TemporaryPasswordDialog
          open={temporaryPassword !== null}
          onOpenChange={(open) => {
            if (!open) {
              setTemporaryPassword(null);
            }
          }}
          userName={account.name}
          temporaryPassword={temporaryPassword}
        />
      ) : null}
    </>
  );
}
