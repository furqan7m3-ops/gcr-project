"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { inviteMemberAction } from "../actions/invitation-mutations";
import type { ActionResult, PendingInvitation } from "../types";

const initialState: ActionResult<PendingInvitation> | null = null;

interface InvitationDialogProps {
  classroomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited: (invitation: PendingInvitation) => void;
}

export function InvitationDialog({
  classroomId,
  open,
  onOpenChange,
  onInvited,
}: InvitationDialogProps) {
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.status === "success") {
      toast.success(`Invitation sent to ${state.data.email}`);
      onOpenChange(false);
      formRef.current?.reset();
      onInvited(state.data);
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Invite someone</DialogTitle>
            <DialogDescription>
              They&apos;ll appear here as pending. No email is sent yet - share the class code
              yourself for now.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="classroomId" value={classroomId} />

          <div className="flex flex-col gap-1.5 py-4">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              autoFocus
            />
            {fieldErrors?.email ? (
              <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Inviting…" : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
