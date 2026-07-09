import { notFound } from "next/navigation";
import { Award, CalendarClock } from "lucide-react";

import { SectionHeader } from "@/components/page/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AssignmentAttachments } from "@/features/classwork/components/assignment-attachments";
import { AssignmentManagementMenu } from "@/features/classwork/components/assignment-management-menu";
import { SubmissionStatusPanel } from "@/features/classwork/components/submission-status-panel";
import { formatDueDate } from "@/features/classwork/lib/format-assignment";
import { getAssignmentDetail } from "@/features/classwork/queries/assignment-queries";
import { listTopicsForClassroom } from "@/features/classwork/queries/topic-queries";
import { SubmissionPanel } from "@/features/submissions/components/submission-panel";
import { getStudentSubmission } from "@/features/submissions/queries/submission-queries";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string; assignmentId: string }>;
}) {
  const { classroomId, assignmentId } = await params;

  const [assignment, topics] = await Promise.all([
    getAssignmentDetail(classroomId, assignmentId),
    listTopicsForClassroom(classroomId),
  ]);

  if (!assignment) {
    notFound();
  }

  const dueDateLabel = formatDueDate(assignment.dueDate);

  const submissionPanel = assignment.canManage ? (
    <SubmissionStatusPanel
      canManage={assignment.canManage}
      studentCount={assignment.studentCount}
    />
  ) : (
    <SubmissionPanel
      classroomId={classroomId}
      assignmentId={assignmentId}
      dueDate={assignment.dueDate}
      initialView={await getStudentSubmission(assignmentId)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title={assignment.title}
        breadcrumbs={[
          { label: "Classwork", href: `/classes/${classroomId}/classwork` },
          { label: assignment.title },
        ]}
        actions={
          assignment.canManage ? (
            <AssignmentManagementMenu
              classroomId={classroomId}
              assignment={assignment}
              topics={topics}
            />
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center gap-2 space-y-0">
              {assignment.status !== "PUBLISHED" ? (
                <Badge variant={assignment.status === "CLOSED" ? "secondary" : "outline"}>
                  {assignment.status === "CLOSED" ? "Closed" : "Draft"}
                </Badge>
              ) : null}
              {dueDateLabel ? (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                  {dueDateLabel}
                </span>
              ) : null}
              {assignment.points !== null ? (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Award className="h-4 w-4" aria-hidden />
                  {assignment.points} points
                </span>
              ) : null}
              <span className="text-sm text-muted-foreground">
                Posted by {assignment.authorName}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {assignment.description ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {assignment.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No instructions provided.</p>
              )}

              {assignment.attachments.length > 0 ? (
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Attachments
                  </p>
                  <AssignmentAttachments attachments={assignment.attachments} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">{submissionPanel}</div>
      </div>
    </div>
  );
}
