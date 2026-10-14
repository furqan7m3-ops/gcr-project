"use client";

import { useState, useTransition } from "react";
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
import { Select } from "@/components/ui/select";

import { rescheduleSlotAction, scheduleSlotAction } from "../actions/timetable-mutations";
import { getSlotAvailabilityAction } from "../actions/timetable-queries";
import { formatSlot } from "../lib/slots";
import type { TimetableClassroomOption, TimetableSlotView } from "../types";
import { SlotPicker } from "./slot-picker";
import { useSlotAvailability } from "./use-slot-availability";

type ScheduleSlotDialogProps = {
  onOpenChange: (open: boolean) => void;
} & (
  | { mode: "create"; classrooms: TimetableClassroomOption[] }
  | { mode: "reschedule"; slot: TimetableSlotView }
);

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isSundayValue(value: string): boolean {
  return new Date(`${value}T00:00:00.000Z`).getUTCDay() === 0;
}

/** Mounted only while open, so every open starts from a clean form. */
export function ScheduleSlotDialog(props: ScheduleSlotDialogProps) {
  const { onOpenChange } = props;
  const isCreate = props.mode === "create";

  const [classroomId, setClassroomId] = useState(
    props.mode === "create" ? (props.classrooms[0]?.id ?? "") : props.slot.classroomId,
  );
  const [date, setDate] = useState(props.mode === "reschedule" ? props.slot.date : "");
  const [hour, setHour] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = localToday();
  const sunday = date !== "" && isSundayValue(date);
  const excludeSlotId = props.mode === "reschedule" ? props.slot.id : undefined;

  const availabilityKey =
    classroomId && date && !sunday ? `${classroomId}|${date}|${excludeSlotId ?? ""}` : null;
  const availability = useSlotAvailability(availabilityKey, () =>
    getSlotAvailabilityAction({ classroomId, date, excludeSlotId }),
  );

  const selectedState = availability.hours?.find((slot) => slot.hour === hour)?.state;
  const willClash = isCreate && selectedState === "section_taken";

  function submit() {
    if (hour === null || !date || !classroomId) {
      return;
    }

    startTransition(async () => {
      const result =
        props.mode === "create"
          ? await scheduleSlotAction({ classroomId, date, startHour: hour })
          : await rescheduleSlotAction({ slotId: props.slot.id, date, startHour: hour });

      if (result.status === "error") {
        toast.error(result.message);
        return;
      }

      if (result.data.outcome === "clash") {
        toast.warning(result.data.message, { duration: 10000 });
      } else {
        toast.success(result.data.message);
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Schedule a class" : "Reschedule class"}</DialogTitle>
          <DialogDescription>
            {props.mode === "reschedule"
              ? `${props.slot.classroomTitle} - currently ${formatSlot(props.slot.date, props.slot.startHour)}.`
              : "Pick a one-hour slot between 8:00 AM and 5:00 PM, Monday to Saturday. Students in the class are notified automatically."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {props.mode === "create" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timetable-classroom">Class</Label>
              <Select
                id="timetable-classroom"
                value={classroomId}
                onChange={(event) => {
                  setClassroomId(event.target.value);
                  setHour(null);
                }}
              >
                {props.classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.title} - Section {classroom.section}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="timetable-date">Date</Label>
            <Input
              id="timetable-date"
              type="date"
              min={today}
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
            <Label>Time slot</Label>
            <SlotPicker
              availability={availability.hours}
              loading={availability.loading}
              value={hour}
              onChange={setHour}
              allowTaken={isCreate}
            />
            {availability.error ? (
              <p className="text-xs text-destructive">{availability.error}</p>
            ) : null}
          </div>

          {willClash ? (
            <p className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
              This section already has a class in that slot, so it won&apos;t be booked. The admin
              will be notified of the clash and will move your class to a free slot.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending || hour === null || !date || !classroomId}>
            {isPending
              ? "Saving…"
              : willClash
                ? "Report clash to admin"
                : isCreate
                  ? "Schedule"
                  : "Move class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
