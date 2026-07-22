"use server";

import { revalidatePath } from "next/cache";

import { AuthError, requireUser } from "@/lib/auth/permissions";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getPasswordPolicyViolations } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import { getSystemSettings } from "@/lib/system-settings";
import { UserStatus } from "@/generated/prisma/enums";
import type { ActionResult } from "@/types/action-result";

import { changePasswordSchema } from "../validation/change-password-schema";

export async function changePasswordAction(
  _prevState: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    // The admin-forced reset (mustChangePassword) skips this - the admin
    // already authenticated that reset out-of-band. Every voluntary,
    // self-service change from Settings must prove the user still knows
    // their current password first.
    const forced = formData.get("forced") === "true";
    if (!forced) {
      const currentPassword = parsed.data.currentPassword ?? "";
      if (!currentPassword) {
        return {
          status: "error",
          message: "Please fix the highlighted fields.",
          fieldErrors: { currentPassword: ["Current password is required."] },
        };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true },
      });
      const isCurrentPasswordValid =
        dbUser?.passwordHash != null &&
        (await verifyPassword(currentPassword, dbUser.passwordHash));
      if (!isCurrentPasswordValid) {
        return {
          status: "error",
          message: "Please fix the highlighted fields.",
          fieldErrors: { currentPassword: ["Current password is incorrect."] },
        };
      }
    }

    const settings = await getSystemSettings();
    const violations = getPasswordPolicyViolations(parsed.data.newPassword, settings);
    if (violations.length > 0) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { newPassword: violations },
      };
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);

    // Clears any admin-forced change and reactivates an account that was
    // pending one - a user only reaches this action while authenticated,
    // which login only allows for ACTIVE or PENDING_PASSWORD_CHANGE accounts.
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false, status: UserStatus.ACTIVE },
    });

    revalidatePath("/change-password");

    return { status: "success", data: undefined };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: error.message };
    }
    console.error(error);
    return { status: "error", message: "Couldn't update your password. Please try again." };
  }
}
