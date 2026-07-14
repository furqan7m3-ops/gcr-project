"use server";

import { revalidatePath } from "next/cache";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as userService from "../services/user-service";
import type {
  ActionResult,
  AdminUserSummary,
  CreatedUserResult,
  ResetPasswordResult,
} from "../types";
import { createUserSchema, setUserStatusSchema, updateUserSchema } from "../validation/user-schema";
import { formDataToObject, toErrorResult } from "./shared";

export async function createUserAction(
  _prevState: ActionResult<CreatedUserResult> | null,
  formData: FormData,
): Promise<ActionResult<CreatedUserResult>> {
  try {
    await canAccessAdminArea();

    const parsed = createUserSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const result = await userService.createUser(parsed.data);
    revalidatePath("/admin/users");

    return { status: "success", data: result };
  } catch (error) {
    return toErrorResult(error, "Couldn't create the user. Please try again.");
  }
}

export async function updateUserAction(
  _prevState: ActionResult<AdminUserSummary> | null,
  formData: FormData,
): Promise<ActionResult<AdminUserSummary>> {
  try {
    const actor = await canAccessAdminArea();

    const parsed = updateUserSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { userId, ...data } = parsed.data;
    const user = await userService.updateUser(userId, data, actor);
    revalidatePath("/admin/users");

    return { status: "success", data: user };
  } catch (error) {
    return toErrorResult(error, "Couldn't update the user. Please try again.");
  }
}

export async function setUserStatusAction(
  userId: string,
  status: string,
): Promise<ActionResult<AdminUserSummary>> {
  try {
    const actor = await canAccessAdminArea();

    const parsed = setUserStatusSchema.safeParse({ userId, status });
    if (!parsed.success) {
      return { status: "error", message: "Invalid status change." };
    }

    const user = await userService.setUserStatus(parsed.data.userId, parsed.data.status, actor);
    revalidatePath("/admin/users");

    return { status: "success", data: user };
  } catch (error) {
    return toErrorResult(error, "Couldn't update this user's status. Please try again.");
  }
}

export async function resetPasswordAction(
  userId: string,
): Promise<ActionResult<ResetPasswordResult>> {
  try {
    const actor = await canAccessAdminArea();
    const result = await userService.resetPassword(userId, actor);
    revalidatePath("/admin/users");

    return { status: "success", data: result };
  } catch (error) {
    return toErrorResult(error, "Couldn't reset this user's password. Please try again.");
  }
}

export async function forcePasswordChangeAction(userId: string): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await userService.forcePasswordChange(userId, actor);
    revalidatePath("/admin/users");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(
      error,
      "Couldn't force a password change for this user. Please try again.",
    );
  }
}
