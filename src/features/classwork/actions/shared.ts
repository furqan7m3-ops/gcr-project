import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError } from "@/lib/auth/permissions";
import { FileValidationBatchError } from "@/lib/storage/file-service";

import type { ActionResult } from "../types";

export { extractUploadedFiles } from "@/lib/storage/extract-files";

export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

export function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof FileValidationBatchError) {
    return { status: "error", message: error.message };
  }

  if (error instanceof AuthError || error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}
