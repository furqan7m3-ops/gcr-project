import { z } from "zod";

export const listNotificationsSchema = z.object({
  cursor: z.string().uuid("Invalid cursor.").optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

export const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Invalid notification id."),
});
