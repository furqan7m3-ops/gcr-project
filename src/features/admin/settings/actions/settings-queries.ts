"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";
import type { SystemSettings } from "@/lib/system-settings";

import * as settingsService from "../services/settings-service";

export async function getSystemSettingsAction(): Promise<SystemSettings> {
  await canAccessAdminArea();
  return settingsService.getSystemSettings();
}
