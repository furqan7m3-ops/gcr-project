import { randomUUID } from "node:crypto";

import { getStorageProvider } from "./index";
import { sanitizeFileName } from "./file-service";
import { validateCoverImage } from "./validation";

export class CoverImageValidationError extends Error {}

/**
 * Uploads a classroom's cover banner and returns the storage key to persist
 * on `Classroom.coverImageUrl`. Unlike lesson attachments, a cover image has
 * no `File`/`FileAttachment` row - it's a single, replaceable value owned
 * directly by the classroom, so the storage key alone is enough.
 */
export async function uploadClassroomCoverImage(file: File, classroomId: string): Promise<string> {
  const error = validateCoverImage(file);
  if (error) {
    throw new CoverImageValidationError(error.message);
  }

  const key = `classroom-covers/${classroomId}-${randomUUID()}-${sanitizeFileName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await getStorageProvider().upload(key, buffer);
  return key;
}

/** Best-effort - a missing/already-deleted key shouldn't block replacing or clearing the cover. */
export async function deleteClassroomCoverImage(key: string): Promise<void> {
  await getStorageProvider().delete(key);
}

const EXTENSION_MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/** Cover images have no `File` row to read a stored MIME type from - derived from the storage key's own file extension instead. */
export function getCoverImageMimeType(key: string): string {
  const dotIndex = key.lastIndexOf(".");
  const extension = dotIndex === -1 ? "" : key.slice(dotIndex + 1).toLowerCase();
  return EXTENSION_MIME_TYPES[extension] ?? "application/octet-stream";
}
