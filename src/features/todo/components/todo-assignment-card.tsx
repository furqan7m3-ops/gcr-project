import Link from "next/link";
import { Award, CalendarClock, ClipboardList } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AttachmentList } from "@/components/files/attachment-list";
import { formatDueDate } from "@/features/classwork/lib/format-assignment";
import { ContentStatusBadge } from "@/features/scheduling/components/content-status-badge";
import { SubmissionStatusBadge } from "@/features/submissions/components/submission-status-badge";

import type { TodoAssignmentItem } from "../types";

/**
 * Mirrors AssignmentCard's layout (same icon circle, due-date/points row,
 * and AttachmentList reuse) with two additions this cross-classroom list
 * needs that a single-classroom card doesn't: the classroom name, and the
 * student's own submission status badge (reusing the same
 * SubmissionStatusBadge/ContentStatusBadge components used everywhere else,
 * not new ones).
 */
export function TodoAssignmentCard({ item }: { item: TodoAssignmentItem }) {
  const dueDateLabel = formatDueDate(item.dueDate);

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/classes/${item.classroomId}/classwork/${item.id}`}
              className="truncate text-sm font-medium text-foreground hover:underline"
            >
              {item.title}
            </Link>
            <SubmissionStatusBadge status={item.submissionStatus} />
            <ContentStatusBadge status={item.assignmentStatus} />
          </div>

          <p className="truncate text-xs text-muted-foreground">{item.classroomTitle}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {dueDateLabel ? (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" aria-hidden />
                {dueDateLabel}
              </span>
            ) : null}
            {item.points !== null ? (
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" aria-hidden />
                {item.points} points
              </span>
            ) : null}
          </div>

          <AttachmentList attachments={item.attachments} className="mt-1 flex flex-col gap-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
