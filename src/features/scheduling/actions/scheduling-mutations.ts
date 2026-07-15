"use server";

import { revalidatePath } from "next/cache";

import { assertManagementAccess } from "@/features/classroom/services/classroom-service";
import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError, requireRole, requireUser } from "@/lib/auth/permissions";
import * as schedulingService from "@/lib/scheduling/content-scheduling-service";
import { SchedulingServiceError } from "@/lib/scheduling/errors";
import { UserRole } from "@/generated/prisma/enums";

import {
  getAllScheduleAdapters,
  getRevalidatePath,
  getScheduleAdapter,
} from "../lib/adapter-registry";
import type { ActionResult, SchedulableContentType } from "../types";
import { contentIdentifierSchema, scheduleContentSchema } from "../validation/schedule-schema";

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (
    error instanceof AuthError ||
    error instanceof ClassroomServiceError ||
    error instanceof SchedulingServiceError
  ) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}

/** Shared auth: only whoever manages the content's classroom (or an admin) may schedule/publish it. */
async function authorizeContent(contentType: SchedulableContentType, contentId: string) {
  const adapter = getScheduleAdapter(contentType);
  const user = await requireUser();

  const record = await adapter.findById(contentId);
  if (!record) {
    throw new SchedulingServiceError("NOT_FOUND", "Content not found.");
  }

  await assertManagementAccess(record.classroomId, user);
  return { adapter, user, classroomId: record.classroomId };
}

/** Teacher chooses "Schedule for later" for a draft (or reschedules an already-scheduled item). */
export async function scheduleContent(
  contentType: SchedulableContentType,
  contentId: string,
  scheduledFor: string,
): Promise<ActionResult<undefined>> {
  try {
    const parsed = scheduleContentSchema.safeParse({ contentType, contentId, scheduledFor });
    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { adapter, classroomId } = await authorizeContent(
      parsed.data.contentType,
      parsed.data.contentId,
    );
    await schedulingService.scheduleContent(
      adapter,
      parsed.data.contentId,
      new Date(parsed.data.scheduledFor),
    );

    revalidatePath(getRevalidatePath(classroomId, parsed.data.contentType));
    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't schedule this content. Please try again.");
  }
}

/** Teacher cancels a pending scheduled publish - reverts the content back to Draft. */
export async function cancelScheduledPublication(
  contentType: SchedulableContentType,
  contentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const parsed = contentIdentifierSchema.safeParse({ contentType, contentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid content." };
    }

    const { adapter, classroomId } = await authorizeContent(
      parsed.data.contentType,
      parsed.data.contentId,
    );
    await schedulingService.cancelScheduledPublication(adapter, parsed.data.contentId);

    revalidatePath(getRevalidatePath(classroomId, parsed.data.contentType));
    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't cancel the scheduled publication. Please try again.");
  }
}

/** Teacher publishes a draft or scheduled item immediately, bypassing any scheduled time. */
export async function publishNow(
  contentType: SchedulableContentType,
  contentId: string,
): Promise<ActionResult<undefined>> {
  try {
    const parsed = contentIdentifierSchema.safeParse({ contentType, contentId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid content." };
    }

    const { adapter, user, classroomId } = await authorizeContent(
      parsed.data.contentType,
      parsed.data.contentId,
    );
    await schedulingService.publishNow(adapter, parsed.data.contentId, user.id);

    revalidatePath(getRevalidatePath(classroomId, parsed.data.contentType));
    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't publish this content. Please try again.");
  }
}

/**
 * Batch-publishes everything past its scheduled time, across all three
 * content types. This is the function a future cron job / worker calls on
 * an interval - see this feature's README notes (surfaced in the chat
 * response) for how that trigger would be wired up. Admin-only for now,
 * since there's no unattended/cron-authenticated caller yet.
 */
export async function publishScheduledContent(): Promise<
  ActionResult<{ contentType: string; contentId: string }[]>
> {
  try {
    await requireRole([UserRole.ADMIN]);

    const published = await schedulingService.publishScheduledContent(getAllScheduleAdapters());

    return { status: "success", data: published };
  } catch (error) {
    return toErrorResult(error, "Couldn't publish scheduled content. Please try again.");
  }
}
