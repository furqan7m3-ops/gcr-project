import { z } from "zod";

export const removeMemberSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom id."),
  userId: z.string().uuid("Invalid user id."),
});
