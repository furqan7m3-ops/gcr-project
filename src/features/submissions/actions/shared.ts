import { ClassroomServiceError } from "@/features/classroom/lib/errors";
import { AuthError } from "@/lib/auth/permissions";

import type { ActionResult } from "../types";
import type { FileMeta } from "../services/submission-service";

export function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }

  return result;
}

// FormData can carry real File entries alongside plain fields - the panel appends
// newly-selected files under "files"; only their metadata is used, never the bytes.
export function extractFileMetas(formData: FormData): FileMeta[] {
  return formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.name !== "")
    .map((file) => ({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }));
}

export function toErrorResult<T>(error: unknown, fallbackMessage: string): ActionResult<T> {
  if (error instanceof AuthError || error instanceof ClassroomServiceError) {
    return { status: "error", message: error.message };
  }

  console.error(error);
  return { status: "error", message: fallbackMessage };
}
