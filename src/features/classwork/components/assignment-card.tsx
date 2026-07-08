import Link from "next/link";
import { Award, CalendarClock, ClipboardList } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { formatDueDate } from "../lib/format-assignment";
import type { AssignmentSummary, TopicSummary } from "../types";
import { AssignmentAttachments } from "./assignment-attachments";
import { AssignmentManagementMenu } from "./assignment-management-menu";

interface AssignmentCardProps {
  assignment: AssignmentSummary;
  classroomId: string;
  topics: TopicSummary[];
}

export function AssignmentCard({ assignment, classroomId, topics }: AssignmentCardProps) {
  const dueDateLabel = formatDueDate(assignment.dueDate);

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/classes/${classroomId}/classwork/${assignment.id}`}
              className="truncate text-sm font-medium text-foreground hover:underline"
            >
              {assignment.title}
            </Link>
            {assignment.status !== "PUBLISHED" ? (
              <Badge variant={assignment.status === "CLOSED" ? "secondary" : "outline"}>
                {assignment.status === "CLOSED" ? "Closed" : "Draft"}
              </Badge>
            ) : null}
          </div>

          {assignment.description ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">{assignment.description}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {dueDateLabel ? (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" aria-hidden />
                {dueDateLabel}
              </span>
            ) : null}
            {assignment.points !== null ? (
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" aria-hidden />
                {assignment.points} points
              </span>
            ) : null}
          </div>

          <AssignmentAttachments
            attachments={assignment.attachments}
            className="mt-1 flex flex-col gap-1"
          />

          <p className="text-xs text-muted-foreground">{assignment.authorName}</p>
        </div>

        {assignment.canManage ? (
          <AssignmentManagementMenu
            classroomId={classroomId}
            assignment={assignment}
            topics={topics}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
