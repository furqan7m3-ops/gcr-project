"use server";

import { revalidatePath } from "next/cache";

import { AuthError, requireUser } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
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
