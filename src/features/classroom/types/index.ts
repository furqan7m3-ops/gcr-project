import type { ClassroomMembershipRole, ClassroomStatus } from "@/generated/prisma/enums";

export type { ActionResult } from "@/types/action-result";

export interface ClassroomSummary {
  id: string;
  title: string;
  section: string | null;
  subject: string | null;
  room: string | null;
  description: string | null;
  code: string;
  coverImageUrl: string | null;
  status: ClassroomStatus;
  ownerId: string;
  ownerName: string;
  /** The current viewer's membership role for this classroom. */
  role: ClassroomMembershipRole;
  createdAt: Date;
}
