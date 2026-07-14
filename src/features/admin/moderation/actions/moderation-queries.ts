"use server";

import { canAccessAdminArea } from "@/lib/auth/permissions";

import * as moderationService from "../services/moderation-service";
import type { ListModerationParams, ModerationPage } from "../types";

export async function getModeratedContentPageAction(
  params: ListModerationParams,
): Promise<ModerationPage> {
  await canAccessAdminArea();
  return moderationService.listModeratedContent(params);
}
