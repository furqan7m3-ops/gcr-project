"use client";

import { useState } from "react";

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

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValue?: string;
  pending?: boolean;
  onConfirm: (scheduledFor: string) => void;
}

/**
 * Shared reschedule dialog used from every management menu's "Schedule…"
 * item (existing draft content, not the create-time flow - see
 * PublishControls for that).
 */
export function ScheduleDialog({
  open,
  onOpenChange,
  defaultValue,
  pending,
  onConfirm,
}: ScheduleDialogProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Schedule publication</DialogTitle>
          <DialogDescription>Choose when this becomes visible to students.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-2">
          <Label htmlFor="schedule-dialog-datetime">Publish date &amp; time</Label>
          <Input
            id="schedule-dialog-datetime"
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => onConfirm(value)} disabled={pending || !value}>
            {pending ? "Scheduling…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
