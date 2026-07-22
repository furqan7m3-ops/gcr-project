import { z } from "zod";

// Length/complexity are enforced dynamically against the platform's
// configured password policy (src/lib/password-policy.ts) inside the action,
// not hardcoded here - this schema only checks shape.
export const changePasswordSchema = z
  .object({
    // Only required for a voluntary (non-forced) change - enforced in the
    // action itself, since "required" here depends on the `forced` flag
    // that travels alongside this data, not on the shape of the data.
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(1, "Password is required.")
      .max(72, "Password must be at most 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
