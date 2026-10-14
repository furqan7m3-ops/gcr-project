"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import * as timetableService from "../services/timetable-service";
import type { ActionResult, ScheduleOutcome } from "../types";
import {
  dismissClashSchema,
  rescheduleSlotSchema,
  resolveClashSchema,
  scheduleSlotSchema,
  slotIdSchema,
} from "../validation/timetable-schema";
import { toErrorResult } from "./shared";

function revalidateTimetable() {
  revalidatePath("/timetable");
  revalidatePath("/admin/timetable");
  revalidatePath("/notifications");
}

export async function scheduleSlotAction(input: {
  classroomId: string;
  date: string;
  startHour: number;
}): Promise<ActionResult<ScheduleOutcome>> {
  try {
    const user = await requireRole([UserRole.TEACHER]);

    const parsed = scheduleSlotSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid slot." };
    }

    const outcome = await timetableService.scheduleSlot(user, parsed.data);
    revalidateTimetable();

    return { status: "success", data: outcome };
  } catch (error) {
    return toErrorResult(error, "Couldn't schedule the class. Please try again.");
  }
}

export async function rescheduleSlotAction(input: {
  slotId: string;
  date: string;
  startHour: number;
}): Promise<ActionResult<ScheduleOutcome>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

    const parsed = rescheduleSlotSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid slot." };
    }

    const outcome = await timetableService.rescheduleSlot(user, parsed.data);
    revalidateTimetable();

    return { status: "success", data: outcome };
  } catch (error) {
    return toErrorResult(error, "Couldn't reschedule the class. Please try again.");
  }
}

export async function cancelSlotAction(slotId: string): Promise<ActionResult<undefined>> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);

    const parsed = slotIdSchema.safeParse({ slotId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid slot." };
    }

    await timetableService.cancelSlot(user, parsed.data.slotId);
    revalidateTimetable();

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't cancel the class. Please try again.");
  }
}

export async function resolveClashAction(input: {
  clashId: string;
  date: string;
  startHour: number;
}): Promise<ActionResult<undefined>> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const parsed = resolveClashSchema.safeParse(input);
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid slot." };
    }

    await timetableService.resolveClash(admin, parsed.data);
    revalidateTimetable();

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't resolve the clash. Please try again.");
  }
}

export async function dismissClashAction(clashId: string): Promise<ActionResult<undefined>> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);

    const parsed = dismissClashSchema.safeParse({ clashId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid clash." };
    }

    await timetableService.dismissClash(admin, parsed.data.clashId);
    revalidateTimetable();

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't dismiss the clash. Please try again.");
  }
}
