"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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

import { dismissClashAction, resolveClashAction } from "../actions/timetable-mutations";
import { getClashAvailabilityAction } from "../actions/timetable-queries";
import { formatSlot, formatSlotDate } from "../lib/slots";
import type { TimetableClashView } from "../types";
import { SlotPicker } from "./slot-picker";
import { useSlotAvailability } from "./use-slot-availability";

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isSundayValue(value: string): boolean {
  return new Date(`${value}T00:00:00.000Z`).getUTCDay() === 0;
}

function ResolveClashDialog({
  clash,
  onOpenChange,
}: {
  clash: TimetableClashView;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = useState(clash.date);
  const [hour, setHour] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const sunday = date !== "" && isSundayValue(date);
  const availability = useSlotAvailability(date && !sunday ? `${clash.id}|${date}` : null, () =>
    getClashAvailabilityAction({ clashId: clash.id, date }),
  );

  function submit() {
    if (hour === null || !date) {
      return;
    }

    startTransition(async () => {
      const result = await resolveClashAction({ clashId: clash.id, date, startHour: hour });
      if (result.status === "success") {
        toast.success(
          `${clash.classroomTitle} moved to ${formatSlot(date, hour)}. Teachers and students were notified.`,
        );
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Resolve clash</DialogTitle>
          <DialogDescription>
            {clash.requestedByName} asked for {clash.classroomTitle} on{" "}
            {formatSlot(clash.date, clash.startHour)}, but Section {clash.section} already has{" "}
            {clash.conflictingClassroomTitle ?? "a class"} then. Move {clash.classroomTitle} to a
            free slot - the existing class keeps its slot.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="clash-date">New date</Label>
            <Input
              id="clash-date"
              type="date"
              min={localToday()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setHour(null);
              }}
            />
            {sunday ? (
              <p className="text-xs text-destructive">Classes run Monday to Saturday.</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>New time slot</Label>
            <SlotPicker
              availability={availability.hours}
              loading={availability.loading}
              value={hour}
              onChange={setHour}
              allowTaken={false}
            />
            {availability.error ? (
              <p className="text-xs text-destructive">{availability.error}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || hour === null || !date}>
            {isPending ? "Moving…" : "Move class & notify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClashList({ clashes }: { clashes: TimetableClashView[] }) {
  const [resolveTarget, setResolveTarget] = useState<TimetableClashView | null>(null);
  const [dismissTarget, setDismissTarget] = useState<TimetableClashView | null>(null);
  const [isDismissing, startDismiss] = useTransition();

  function confirmDismiss() {
    if (!dismissTarget) {
      return;
    }
    const target = dismissTarget;

    startDismiss(async () => {
      const result = await dismissClashAction(target.id);
      if (result.status === "success") {
        toast.success("Clash dismissed.");
        setDismissTarget(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  if (clashes.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="No clashes"
        description="Nothing needs your attention. Clashes show up here when a teacher requests a slot that the section already has a class in."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {clashes.map((clash) => (
        <Card
          key={clash.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
              <TriangleAlert className="h-4 w-4 text-amber-500" aria-hidden />
              {clash.classroomTitle} · Section {clash.section}
              <Badge
                variant={
                  clash.status === "PENDING"
                    ? "destructive"
                    : clash.status === "RESOLVED"
                      ? "default"
                      : "secondary"
                }
              >
                {clash.status === "PENDING"
                  ? "Needs attention"
                  : clash.status === "RESOLVED"
                    ? "Resolved"
                    : "Dismissed"}
              </Badge>
            </p>
            <p className="text-sm text-foreground">
              {clash.requestedByName} requested {formatSlot(clash.date, clash.startHour)}
            </p>
            <p className="text-sm text-muted-foreground">
              Already booked by {clash.conflictingClassroomTitle ?? "another class"}
              {clash.conflictingTeacherName ? ` (${clash.conflictingTeacherName})` : ""}
            </p>
            {clash.status === "RESOLVED" &&
            clash.resolvedDate &&
            clash.resolvedStartHour !== null ? (
              <p className="text-sm text-muted-foreground">
                Moved to {formatSlot(clash.resolvedDate, clash.resolvedStartHour)}
                {clash.resolvedByName ? ` by ${clash.resolvedByName}` : ""}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Reported {formatSlotDate(clash.createdAt)}
            </p>
          </div>

          {clash.status === "PENDING" ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setResolveTarget(clash)}>
                Resolve
              </Button>
              <Button variant="outline" size="sm" onClick={() => setDismissTarget(clash)}>
                Dismiss
              </Button>
            </div>
          ) : null}
        </Card>
      ))}

      {resolveTarget ? (
        <ResolveClashDialog
          clash={resolveTarget}
          onOpenChange={(open) => !open && setResolveTarget(null)}
        />
      ) : null}

      <ConfirmDialog
        open={dismissTarget !== null}
        onOpenChange={(open) => !open && setDismissTarget(null)}
        title="Dismiss this clash?"
        description="No class will be scheduled and nobody is notified. Use this when the teacher has already picked another slot."
        confirmLabel="Dismiss"
        pending={isDismissing}
        onConfirm={confirmDismiss}
      />
    </div>
  );
}
