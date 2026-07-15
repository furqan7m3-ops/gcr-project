import { AuthError, requireRole } from "@/lib/auth/permissions";
import { UserRole } from "@/generated/prisma/enums";

import * as reviewService from "../services/review-service";
import type { ReviewQueueFilters, ReviewQueueResult } from "../types";

// Teacher/Admin-only surface - the proxy already redirects other roles away
// from /review, this is the defense-in-depth check at the data layer. Null
// signals "not allowed", matching the NOT_FOUND/FORBIDDEN -> null convention
// used throughout the submissions feature's own teacher-only queries.
export async function getReviewQueue(
  filters: ReviewQueueFilters,
): Promise<ReviewQueueResult | null> {
  try {
    const user = await requireRole([UserRole.TEACHER, UserRole.ADMIN]);
    return await reviewService.getTeacherReviewQueue(user, filters);
  } catch (error) {
    if (error instanceof AuthError) {
      return null;
    }
    throw error;
  }
}
