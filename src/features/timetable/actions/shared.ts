import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError } from "@/lib/auth/permissions";

import { TimetableServiceError } from "../lib/errors";
import type { ActionResult } from "../types";

export function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (
    error instanceof AuthError ||
    error instanceof ClassroomServiceError ||
    error instanceof TimetableServiceError
  ) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}
