"use server";

import { revalidatePath } from "next/cache";

import * as userService from "@/features/admin/users/services/user-service";
import { AdminUserServiceError } from "@/features/admin/users/lib/errors";
import type { ResetPasswordResult } from "@/features/admin/users/types";
import { AuthError, canAccessAdminArea } from "@/lib/auth/permissions";
import type { ActionResult } from "@/types/action-result";

import { AdminSecurityServiceError } from "../lib/errors";
import * as securityService from "../services/security-service";

function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (
    error instanceof AuthError ||
    error instanceof AdminSecurityServiceError ||
    error instanceof AdminUserServiceError
  ) {
    return { status: "error", message: error.message };
  }
  console.error(error);
  return { status: "error", message: fallbackMessage };
}

export async function terminateSessionAction(sessionId: string): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await securityService.terminateSession(sessionId, actor);
    revalidatePath("/admin/security");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't terminate this session. Please try again.");
  }
}

export async function unlockAccountAction(userId: string): Promise<ActionResult<undefined>> {
  try {
    const actor = await canAccessAdminArea();
    await securityService.unlockAccount(userId, actor);
    revalidatePath("/admin/security");

    return { status: "success", data: undefined };
  } catch (error) {
    return toErrorResult(error, "Couldn't unlock this account. Please try again.");
  }
}

export async function forcePasswordResetAction(
  userId: string,
): Promise<ActionResult<ResetPasswordResult>> {
  try {
    const actor = await canAccessAdminArea();
    const result = await userService.resetPassword(userId, actor);
    revalidatePath("/admin/security");
    revalidatePath("/admin/users");

    return { status: "success", data: result };
  } catch (error) {
    return toErrorResult(error, "Couldn't reset this user's password. Please try again.");
  }
}
