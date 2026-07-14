export type AdminSecurityErrorCode = "NOT_FOUND" | "VALIDATION_ERROR";

export class AdminSecurityServiceError extends Error {
  constructor(
    public readonly code: AdminSecurityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AdminSecurityServiceError";
  }
}
