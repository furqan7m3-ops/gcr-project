import { Award, CalendarClock, ClipboardList, Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { AssignmentSummary, TopicSummary } from "../types";
import { AssignmentManagementMenu } from "./assignment-management-menu";

function formatDueDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }

  return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

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
            <p className="truncate text-sm font-medium text-foreground">{assignment.title}</p>
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

          {assignment.attachments.length > 0 ? (
            <div className="mt-1 flex flex-col gap-1">
              {assignment.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  title="File contents aren't stored yet - this is metadata only."
                >
                  <Paperclip className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{attachment.fileName}</span>
                </div>
              ))}
            </div>
          ) : null}

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
