/**
 * Pulls real, non-empty `File` entries out of a form field - shared by every
 * create/edit/submit Server Action that accepts attachments (announcements,
 * materials, assignments, submissions), replacing four independent copies of
 * this exact filter that used to live one per feature.
 */
export function extractUploadedFiles(formData: FormData, fieldName = "files"): File[] {
  return formData
    .getAll(fieldName)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0 && entry.name !== "");
}
