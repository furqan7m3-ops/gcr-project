import { z } from "zod";

const textAnswerField = z
  .string()
  .max(20_000, "Your response must be at most 20000 characters.")
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const submissionMutationSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom id."),
  assignmentId: z.string().uuid("Invalid assignment id."),
  textAnswer: textAnswerField,
});

export type SubmissionMutationInput = z.infer<typeof submissionMutationSchema>;

export const classroomAssignmentIdSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom id."),
  assignmentId: z.string().uuid("Invalid assignment id."),
});

export const removeAttachmentSchema = z.object({
  submissionId: z.string().uuid("Invalid submission id."),
  fileAttachmentId: z.string().uuid("Invalid attachment id."),
});
