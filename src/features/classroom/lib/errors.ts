export type ClassroomErrorCode =
  | "NOT_FOUND"
  | "ARCHIVED"
  | "ALREADY_ENROLLED"
  | "NOT_A_MEMBER"
  | "OWNER_CANNOT_LEAVE"
  | "FORBIDDEN"
  | "CODE_GENERATION_FAILED";

export class ClassroomServiceError extends Error {
  constructor(
    public readonly code: ClassroomErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ClassroomServiceError";
  }
}
