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
import { Textarea } from "@/components/ui/textarea";

import { updateAnnouncementAction } from "../actions/stream-mutations";
import type { ActionResult, AnnouncementSummary } from "../types";

const initialState: ActionResult<AnnouncementSummary> | null = null;

interface AnnouncementEditDialogProps {
  classroomId: string;
  announcement: AnnouncementSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementEditDialog({
  classroomId,
  announcement,
  open,
  onOpenChange,
}: AnnouncementEditDialogProps) {
  const [state, formAction, isPending] = useActionState(updateAnnouncementAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.status === "success") {
      toast.success("Announcement updated");
      onOpenChange(false);
    } else if (!state.fieldErrors) {
      toast.error(state.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fieldErrors = state?.status === "error" ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Edit announcement</DialogTitle>
            <DialogDescription>Update what you shared with your class.</DialogDescription>
          </DialogHeader>

          <input type="hidden" name="classroomId" value={classroomId} />
          <input type="hidden" name="announcementId" value={announcement.id} />

          <div className="py-4">
            <Textarea
              name="content"
              defaultValue={announcement.content}
              rows={4}
              required
              maxLength={5000}
              autoFocus
            />
            {fieldErrors?.content ? (
              <p className="mt-1.5 text-xs text-destructive">{fieldErrors.content[0]}</p>
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
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
