"use server";

import { requireRole } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import * as timetableService from "../services/timetable-service";
import type { ActionResult, SlotHourAvailability } from "../types";
import { availabilitySchema, clashAvailabilitySchema } from "../validation/timetable-schema";
import { toErrorResult } from "./shared";

/** Which hours of a date are free for a class - powers the teacher's slot picker. */
export async function getSlotAvailabilityAction(input: {
  classroomId: string;
  dayOfWeek: number;
  excludeSlotId?: string;
  room?: string;
}): Promise<ActionResult<SlotHourAvailability[]>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

    const parsed = availabilitySchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid request." };
    }

    const hours = await timetableService.getSlotAvailability(user, parsed.data);
    return { status: "success", data: hours };
  } catch (error) {
    return toErrorResult(error, "Couldn't load slot availability.");
  }
}

/** Which hours of a date are free for the blocked class in a clash - powers the admin's slot picker. */
export async function getClashAvailabilityAction(input: {
  clashId: string;
  dayOfWeek: number;
  room?: string;
}): Promise<ActionResult<SlotHourAvailability[]>> {
  try {
    await requireRole([UserRole.ADMIN]);

    const parsed = clashAvailabilitySchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid request." };
    }

    const hours = await timetableService.getClashAvailability(
      parsed.data.clashId,
      parsed.data.dayOfWeek,
      parsed.data.room,
    );
    return { status: "success", data: hours };
  } catch (error) {
    return toErrorResult(error, "Couldn't load slot availability.");
  }
}
