export type AdminModerationErrorCode = "NOT_FOUND" | "VALIDATION_ERROR";

export class AdminModerationServiceError extends Error {
  constructor(
    public readonly code: AdminModerationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdminModerationServiceError";
  }
}
