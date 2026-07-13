import { z } from "zod";

const notificationTypeValues = [
  "NEW_ASSIGNMENT",
  "NEW_MATERIAL",
  "NEW_ANNOUNCEMENT",
  "SUBMISSION_RETURNED",
  "PRIVATE_COMMENT",
  "GENERAL",
] as const;

export const listNotificationsSchema = z.object({
  cursor: z.string().uuid("Invalid cursor.").optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
  type: z.enum(notificationTypeValues).optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Invalid notification id."),
});
