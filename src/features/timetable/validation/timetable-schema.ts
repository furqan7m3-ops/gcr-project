import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.");
const startHour = z.coerce.number().int("Pick a valid time slot.");

export const scheduleSlotSchema = z.object({
  classroomId: z.string().uuid("Pick a class."),
  date: dateOnly,
  startHour,
});

export const rescheduleSlotSchema = z.object({
  slotId: z.string().uuid("Invalid slot."),
  date: dateOnly,
  startHour,
});

export const slotIdSchema = z.object({ slotId: z.string().uuid("Invalid slot.") });

export const availabilitySchema = z.object({
  classroomId: z.string().uuid("Pick a class."),
  date: dateOnly,
  /** When rescheduling, the slot being moved is ignored so it doesn't block itself. */
  excludeSlotId: z.string().uuid().optional(),
});

export const resolveClashSchema = z.object({
  clashId: z.string().uuid("Invalid clash."),
  date: dateOnly,
  startHour,
});

export const clashAvailabilitySchema = z.object({
  clashId: z.string().uuid("Invalid clash."),
  date: dateOnly,
});

export const dismissClashSchema = z.object({ clashId: z.string().uuid("Invalid clash.") });
