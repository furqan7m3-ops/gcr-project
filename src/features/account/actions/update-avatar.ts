"use server";

import { revalidatePath } from "next/cache";

import { AuthError, requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  AvatarValidationError,
  deleteUserAvatar,
  uploadUserAvatar,
} from "@/lib/storage/avatar-service";
import { extractUploadedFiles } from "@/lib/storage/extract-files";
import type { ActionResult } from "@/types/action-result";

export async function updateAvatarAction(
  _prevState: ActionResult<undefined> | null,
  formData: FormData,
): Promise<ActionResult<undefined>> {
  try {
    const user = await requireUser();

    const file = extractUploadedFiles(formData, "avatar")[0];
    if (!file) {
      return { status: "error", message: "Choose a photo to upload." };
    }

    const key = await uploadUserAvatar(file, user.id);

    const previous = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatarStorageKey: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      // avatarUrl becomes the stable serving route rather than the raw
      // storage key - every existing call site that renders `user.avatarUrl`
      // directly as an <img src> keeps working unchanged, exactly as it
      // already does for the pre-existing external (e.g. seeded) URLs.
      data: { avatarUrl: `/api/avatars/${user.id}`, avatarStorageKey: key },
    });

    // Best-effort cleanup of the file this replaced - never blocks the
    // update itself from returning successfully.
    if (previous?.avatarStorageKey) {
      await deleteUserAvatar(previous.avatarStorageKey).catch(() => {});
    }

    revalidatePath("/profile");

    return { status: "success", data: undefined };
  } catch (error) {
    if (error instanceof AuthError || error instanceof AvatarValidationError) {
      return { status: "error", message: error.message };
    }
    console.error(error);
    return { status: "error", message: "Couldn't update your profile photo. Please try again." };
  }
}
