"use client";

import { CalendarDays, CalendarPlus, Clock, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { cancelSlotAction } from "../actions/timetable-mutations";
import { formatHourRange, formatSlot, formatSlotDate } from "../lib/slots";
import type { TimetableClassroomOption, TimetableSlotView } from "../types";
import { ScheduleSlotDialog } from "./schedule-slot-dialog";

interface TimetableBoardProps {
  slots: TimetableSlotView[];
  /** Classes the viewer can schedule. Empty/omitted for students (view-only). */
  schedulableClassrooms?: TimetableClassroomOption[];
  canSchedule: boolean;
  /** Today as "YYYY-MM-DD" in the server's timezone - for the "Today" badge. */
  today: string;
}

type DialogState = { kind: "create" } | { kind: "reschedule"; slot: TimetableSlotView } | null;

function groupByDate(slots: TimetableSlotView[]): [string, TimetableSlotView[]][] {
  const groups = new Map<string, TimetableSlotView[]>();
  for (const slot of slots) {
    groups.set(slot.date, [...(groups.get(slot.date) ?? []), slot]);
  }
  return Array.from(groups.entries());
}

export function TimetableBoard({
  slots,
  schedulableClassrooms = [],
  canSchedule,
  today,
}: TimetableBoardProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [cancelTarget, setCancelTarget] = useState<TimetableSlotView | null>(null);
  const [isCancelling, startCancel] = useTransition();

  function confirmCancel() {
    if (!cancelTarget) {
      return;
    }
    const target = cancelTarget;

    startCancel(async () => {
      const result = await cancelSlotAction(target.id);
      if (result.status === "success") {
        toast.success(
          `${target.classroomTitle} on ${formatSlot(target.date, target.startHour)} cancelled.`,
        );
        setCancelTarget(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  const scheduleButton = canSchedule ? (
    <Button
      onClick={() => setDialog({ kind: "create" })}
      disabled={schedulableClassrooms.length === 0}
    >
      <CalendarPlus aria-hidden /> Schedule a class
    </Button>
  ) : null;

  const groups = groupByDate(slots);

  return (
    <div className="flex flex-col gap-6">
      {scheduleButton ? (
        <div className="flex flex-col items-start gap-2">
          {scheduleButton}
          {schedulableClassrooms.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              You need an active class with a section before you can schedule it.
            </p>
          ) : null}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming classes"
          description={
            canSchedule
              ? "Schedule a class and its students will be notified."
              : "Your teachers haven't scheduled any upcoming classes yet."
          }
        />
      ) : (
        groups.map(([date, daySlots]) => (
          <section key={date} className="flex flex-col gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {formatSlotDate(date)}
              {date === today ? <Badge>Today</Badge> : null}
            </h2>
            <div className="flex flex-col gap-2">
              {daySlots.map((slot) => (
                <Card
                  key={slot.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {formatHourRange(slot.startHour)}
                    </p>
                    <p className="text-base font-semibold text-foreground">{slot.classroomTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      Section {slot.section}
                      {slot.subject ? ` · ${slot.subject}` : ""} · {slot.teacherName}
                    </p>
                  </div>

                  {slot.canManage ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialog({ kind: "reschedule", slot })}
                      >
                        <Pencil aria-hidden /> Reschedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setCancelTarget(slot)}>
                        <Trash2 aria-hidden /> Cancel
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      {dialog?.kind === "create" ? (
        <ScheduleSlotDialog
          mode="create"
          classrooms={schedulableClassrooms}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "reschedule" ? (
        <ScheduleSlotDialog
          mode="reschedule"
          slot={dialog.slot}
          onOpenChange={(open) => !open && setDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel this class?"
        description={
          cancelTarget
            ? `${cancelTarget.classroomTitle} on ${formatSlot(cancelTarget.date, cancelTarget.startHour)} will be removed from the timetable and its students will be notified.`
            : ""
        }
        confirmLabel="Cancel class"
        destructive
        pending={isCancelling}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
