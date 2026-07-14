"use server";

import { revalidatePath } from "next/cache";

import { AuthError, canAccessAdminArea } from "@/lib/auth/permissions";
import type { SystemSettings } from "@/lib/system-settings";
import type { ActionResult } from "@/types/action-result";

import * as settingsService from "../services/settings-service";
import { updateSettingsSchema } from "../validation/settings-schema";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function updateSettingsAction(
  _prevState: ActionResult<SystemSettings> | null,
  formData: FormData,
): Promise<ActionResult<SystemSettings>> {
  try {
    const actor = await canAccessAdminArea();

    const parsed = updateSettingsSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const settings = await settingsService.updateSystemSettings(parsed.data, actor);

    revalidatePath("/admin/settings");
    // Platform name is shown in the app/admin headers and page metadata,
    // which live under the root layout - revalidate the whole tree.
    revalidatePath("/", "layout");

    return { status: "success", data: settings };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: error.message };
    }
    console.error(error);
    return { status: "error", message: "Couldn't save settings. Please try again." };
  }
}
