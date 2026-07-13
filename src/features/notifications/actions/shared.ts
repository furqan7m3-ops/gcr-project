import { NotificationServiceError } from "../lib/errors";
import { AuthError } from "@/lib/auth/permissions";

import type { ActionResult } from "../types";

export function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError || error instanceof NotificationServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}
