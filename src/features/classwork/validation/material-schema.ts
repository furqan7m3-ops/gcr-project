import { z } from "zod";

function optionalTrimmed(max: number, label: string) {
  return z
    .string()
    .max(max, `${label} must be at most ${max} characters.`)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    });
}

const urlField = z
  .string()
  .max(2000, "URL is too long.")
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  })
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), {
    message: "URL must start with http:// or https://.",
  });

const topicIdField = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  })
  .refine((value) => !value || z.string().uuid().safeParse(value).success, {
    message: "Invalid topic.",
  });

export const createMaterialSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom id."),
  title: z
    .string()
    .trim()
    .min(1, "Title can't be empty.")
    .max(150, "Title must be at most 150 characters."),
  description: optionalTrimmed(2000, "Description"),
  url: urlField,
  topicId: topicIdField,
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

export const updateMaterialSchema = createMaterialSchema.extend({
  materialId: z.string().uuid("Invalid material id."),
});

export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;

export const materialIdSchema = z.object({
  materialId: z.string().uuid("Invalid material id."),
});
