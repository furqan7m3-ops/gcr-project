"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/permissions";

import * as invitationService from "../services/invitation-service";
import type { ActionResult, PendingInvitation } from "../types";
import { cancelInvitationSchema, inviteMemberSchema } from "../validation/invitation-schema";
import { formDataToObject, toErrorResult } from "./shared";

export async function inviteMemberAction(
  _prevState: ActionResult<PendingInvitation> | null,
  formData: FormData,
): Promise<ActionResult<PendingInvitation>> {
  try {
    const user = await requireUser();

    const parsed = inviteMemberSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const invitation = await invitationService.inviteMember(
      parsed.data.classroomId,
      user,
      parsed.data.email,
    );
    revalidatePath(`/classes/${parsed.data.classroomId}/people`);

    return { status: "success", data: invitation };
  } catch (error) {
    return toErrorResult(error, "Couldn't send the invitation. Please try again.");
  }
}

export async function cancelInvitationAction(
  classroomId: string,
  invitationId: string,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = cancelInvitationSchema.safeParse({ classroomId, invitationId });
    if (!parsed.success) {
      return { status: "error", message: "Invalid invitation." };
    }

    await invitationService.cancelInvitation(
      parsed.data.classroomId,
      parsed.data.invitationId,
      user,
    );
    revalidatePath(`/classes/${classroomId}/people`);

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't cancel the invitation. Please try again.");
  }
}
