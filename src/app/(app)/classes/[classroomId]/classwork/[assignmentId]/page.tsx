import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Award, CalendarClock } from "lucide-react";

import { SectionHeader } from "@/components/page/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AssignmentAttachments } from "@/features/classwork/components/assignment-attachments";
import { AssignmentManagementMenu } from "@/features/classwork/components/assignment-management-menu";
import { formatDueDate } from "@/features/classwork/lib/format-assignment";
import { getAssignmentDetail } from "@/features/classwork/queries/assignment-queries";
import { listTopicsForClassroom } from "@/features/classwork/queries/topic-queries";
import { SubmissionOverviewCard } from "@/features/submissions/components/submission-overview-card";
import { SubmissionPanel } from "@/features/submissions/components/submission-panel";
import {
  getAssignmentSubmissions,
  getOwnSubmissionComments,
  getStudentSubmission,
} from "@/features/submissions/queries/submission-queries";
import { requireUser } from "@/lib/auth/permissions";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ classroomId: string; assignmentId: string }>;
}) {
  const { classroomId, assignmentId } = await params;

  const [assignment, topics, user] = await Promise.all([
    getAssignmentDetail(classroomId, assignmentId),
    listTopicsForClassroom(classroomId),
    requireUser(),
  ]);

  if (!assignment) {
    notFound();
  }

  const dueDateLabel = formatDueDate(assignment.dueDate);

  let submissionPanel: ReactNode;
  if (assignment.canManage) {
    const overview = await getAssignmentSubmissions(classroomId, assignmentId);
    if (!overview) {
      // Defensive only: assignment.canManage already confirms access to this
      // classroom, so the service call underneath should never actually 404/403 here.
      notFound();
    }
    submissionPanel = (
      <SubmissionOverviewCard
        classroomId={classroomId}
        assignmentId={assignmentId}
        overview={overview}
      />
    );
  } else {
    submissionPanel = (
      <SubmissionPanel
        classroomId={classroomId}
        assignmentId={assignmentId}
        studentId={user.id}
        dueDate={assignment.dueDate}
        initialView={await getStudentSubmission(assignmentId)}
        initialComments={await getOwnSubmissionComments(assignmentId)}
      />
    );
  }

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
