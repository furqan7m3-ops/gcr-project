import { ClassroomMembershipRole } from "@/generated/prisma/enums";

/** Whether this membership role can manage the classroom (edit/archive/post as teacher). */
export function canManageClassroom(role: ClassroomMembershipRole): boolean {
  return (
    role === ClassroomMembershipRole.OWNER ||
    role === ClassroomMembershipRole.TEACHER ||
    role === ClassroomMembershipRole.CO_TEACHER
  );
}
