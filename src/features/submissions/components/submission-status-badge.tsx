import { Badge } from "@/components/ui/badge";

import type { SubmissionDetail } from "../types";

interface SubmissionStatusBadgeProps {
  submission: SubmissionDetail | null;
}

export function SubmissionStatusBadge({ submission }: SubmissionStatusBadgeProps) {
  if (!submission || submission.status === "ASSIGNED") {
    // No row yet ("Assigned") and an in-progress row ("Draft") are both pre-submission -
    // the only user-visible difference is whether they've saved anything yet.
    return <Badge variant="outline">{submission ? "Draft" : "Assigned"}</Badge>;
  }

  if (submission.status === "LATE") {
    return <Badge variant="destructive">Late</Badge>;
  }

  if (submission.status === "SUBMITTED") {
    return <Badge>Submitted</Badge>;
  }

  return <Badge variant="secondary">{submission.status}</Badge>;
}
